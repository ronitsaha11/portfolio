import type { Scene } from "../types";

const REPO = "https://github.com/ronitsaha11/HealthTrack";
const BLOB = `${REPO}/blob/master/app/src/main/java/com/healthtrack`;
const M = "2026-08-27";

export const healthtrack: Scene = {
  slug: "healthtrack",
  sceneNumber: 2,
  name: "HealthTrack",
  subtitle: "Android health and medication tracking",
  oneLiner:
    "A reminder that fires late is a reminder that failed. Built so scheduling survives reboots, timezone shifts and clock changes.",

  problem:
    "A medication reminder is not a notification feature. If the phone reboots, the user changes timezone, or the system clock is adjusted, every pending alarm on Android is silently discarded. The app that treats reminders as UI state loses them, and the user does not find out until the dose is missed.",

  invariant:
    "Every reminder the user has set exists in exactly one known state at all times, and that state survives the operating system deciding to forget it.",

  approach:
    "The app is split strictly into data, domain and presentation, with repository interfaces declared in the domain layer and implemented in data — and explicit mappers between Room entities and domain models, so persistence details never leak upward. Reminder state is a state machine in the domain layer rather than a set of booleans on a view model. Exact timing goes through AlarmManager; everything durable around it — rescheduling after boot, reconciling with Firestore, fetching config — runs as WorkManager jobs, which the OS is obliged to complete. Room is the source of truth, and Firestore workers reconcile it across devices rather than owning it.",

  hardPart: {
    title: "Rebuilding a schedule the OS threw away",
    body: "Android clears all pending alarms on reboot, and offers no callback for a timezone or clock change beyond a broadcast you must register for. Three receivers listen — boot completed, time changed, timezone changed — and each enqueues the same rescheduling worker rather than doing the work inline, because a broadcast receiver has seconds to live and rescheduling dozens of alarms against the database does not fit in that window. The worker is idempotent: it recomputes the full schedule from Room rather than trying to diff against what it thinks is pending, because after a reboot that belief is exactly the thing that is no longer true.",
  },

  limitation:
    "There is no test source set. For an app whose entire argument is reliability, that is the first thing worth fixing and the first question an interviewer should ask. The commit history is also a single day of bulk commits, so it shows the result rather than the process.",

  ownership: "Sole author. All 7 commits.",

  stack: [
    "Kotlin",
    "Jetpack Compose",
    "MVVM",
    "Hilt",
    "Room",
    "DataStore",
    "WorkManager",
    "AlarmManager",
    "Health Connect SDK",
    "Firebase Auth",
    "Firestore",
    "BiometricPrompt",
  ],

  layers: [
    {
      id: "presentation",
      name: "Presentation",
      role: "Compose screens and view models. Holds no scheduling logic and no persistence.",
      modules: ["presentation/analytics/AnalyticsViewModel.kt", "presentation/auth/BiometricLockScreen.kt"],
      depth: 4,
    },
    {
      id: "domain",
      name: "Domain",
      role: "Use cases, models, repository interfaces and the reminder state machine. No Android imports.",
      modules: ["domain/statemachine/ReminderStateMachine.kt", "domain/usecase/ReminderUseCases.kt", "domain/repository/ReminderRepository.kt"],
      depth: 2,
    },
    {
      id: "scheduling",
      name: "Scheduling",
      role: "Exact alarms, boot and clock-change receivers, and the idempotent rescheduling worker.",
      modules: ["data/scheduler/AlarmSchedulerImpl.kt", "data/receiver/BootReceiver.kt", "data/worker/RescheduleRemindersWorker.kt"],
      depth: 1,
    },
    {
      id: "data",
      name: "Data",
      role: "Room as source of truth, Firestore sync workers, Health Connect, and entity/domain mappers.",
      modules: ["data/local/HealthTrackDatabase.kt", "data/repository/FirestoreSyncRepository.kt", "data/health/HealthConnectManager.kt"],
      depth: 0,
    },
  ],

  readings: [
    {
      id: "ht-files",
      value: "174",
      label: "Files · sole author",
      detail: "The full application source, all authored by ronitsaha11.",
      confidence: "measured",
      samples: [{ label: "Repository tree", href: REPO, kind: "api", measuredAt: M }],
    },
    {
      id: "ht-di",
      value: "6",
      label: "Hilt modules",
      detail: "Dependency injection split by concern: auth, database, network, repository, scheduler, work manager.",
      confidence: "measured",
      samples: [{ label: "com/healthtrack/di", href: `${REPO}/tree/master/app/src/main/java/com/healthtrack/di`, kind: "code", measuredAt: M }],
    },
    {
      id: "ht-workers",
      value: "6",
      label: "Background workers",
      detail: "Config fetch, database sync, Firestore download, reminder sync, reschedule, trigger delivery.",
      confidence: "measured",
      samples: [{ label: "data/worker", href: `${REPO}/tree/master/app/src/main/java/com/healthtrack/data/worker`, kind: "code", measuredAt: M }],
    },
    {
      id: "ht-receivers",
      value: "5",
      label: "System receivers",
      detail: "Boot, time change, alarm, fitness-goal alarm and notification action.",
      confidence: "measured",
      samples: [{ label: "data/receiver", href: `${REPO}/tree/master/app/src/main/java/com/healthtrack/data/receiver`, kind: "code", measuredAt: M }],
    },
  ],

  decisions: [
    {
      id: "ht-adr-reschedule",
      title: "Receivers enqueue work; they never do it",
      context:
        "BOOT_COMPLETED and TIME_CHANGED arrive as broadcasts. A receiver has a few seconds before the system may kill it, and rescheduling every reminder means reading the database and calling AlarmManager repeatedly.",
      options: [
        { option: "Reschedule inline in the receiver", rejected: true, reason: "Exceeds the broadcast window on a cold boot with many reminders; work is killed halfway." },
        { option: "Start a foreground service", rejected: true, reason: "Heavier than the task needs, and shows the user a notification for housekeeping." },
        { option: "Enqueue a WorkManager job", rejected: false, reason: "The OS guarantees it runs, retries it, and survives process death." },
      ],
      decision:
        "Each receiver does exactly one thing: enqueue RescheduleRemindersWorker.",
      consequence:
        "Rescheduling is slightly delayed after boot but is guaranteed to complete. The worker is written to be idempotent so a retry is harmless.",
    },
    {
      id: "ht-adr-state",
      title: "Reminder state as a machine, not as flags",
      context:
        "A reminder is scheduled, then fired, then acted on or missed — and can be edited or deleted at any point in that sequence.",
      options: [
        { option: "Boolean flags on the entity", rejected: true, reason: "Permits impossible combinations, e.g. fired and not-yet-scheduled at once." },
        { option: "An enum with transitions checked at call sites", rejected: true, reason: "Every new call site is a new chance to skip the check." },
        { option: "An explicit state machine in the domain layer", rejected: false, reason: "Invalid transitions cannot be expressed." },
      ],
      decision: "ReminderStateMachine owns every transition; nothing else writes status.",
      consequence:
        "Adding a state means editing one file. The UI and the workers both ask the same object what is legal.",
    },
  ],

  links: [
    { label: "REPOSITORY", href: REPO },
    { label: "COMMITS", href: `${REPO}/commits/master` },
  ],

  year: "2026",
  confidence: "measured",
};

export const healthtrackSource = {
  path: "domain/statemachine/ReminderStateMachine.kt",
  href: `${BLOB}/domain/statemachine/ReminderStateMachine.kt`,
};

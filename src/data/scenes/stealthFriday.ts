import type { Scene } from "../types";

const REPO = "https://github.com/ronitsaha11/Stealth-FRIDAY";
const M = "2026-08-27";

export const stealthFriday: Scene = {
  slug: "stealth-friday",
  sceneNumber: 3,
  name: "Stealth F.R.I.D.A.Y",
  subtitle: "Local-first voice agent · dashboard and automation layer",
  oneLiner:
    "A voice agent that runs entirely on your own machine, with a real-time dashboard streaming its state over WebSocket and an automation layer that lets it act on the system.",

  problem:
    "A voice assistant that ships every utterance to a cloud API is a privacy decision disguised as an architecture decision. Running the whole pipeline locally — wake word, transcription, planning, execution, speech — removes that, but replaces it with a harder problem: a long-running local process has no interface, so when it misbehaves there is nothing to look at.",

  invariant:
    "The agent's live state — what it heard, which module is active, whether it is listening, thinking or speaking — is observable from outside the process at all times.",

  approach:
    "The agent core runs a local pipeline: an always-on wake-word listener, Faster-Whisper for transcription on-device, a rule-based planner with an LLM fallback through Groq, a tool executor, and offline text-to-speech. My work sits around that core. A WebSocket bridge publishes agent state as it changes; a Next.js dashboard subscribes through a single typed hook and renders the live agent state, last command, active module and system health. An automation layer adds browser, network and system tools the executor can dispatch to, and the whole thing was ported from macOS launch agents to Windows.",

  hardPart: {
    title: "Making a long-running local process observable",
    body: "The agent is a Python process with no natural interface, and the dashboard is a React app that can be opened, closed and reopened at any moment. The connection therefore cannot be the source of truth — a client that connects halfway through a command must still render the correct state. The socket hook owns reconnection with backoff and treats every inbound message as a full state snapshot rather than a delta, so a client that missed messages converges as soon as the next one arrives. The alternative — replaying an event log on connect — would have meant the agent keeping history it otherwise has no reason to store.",
  },

  limitation:
    "The repository has four commits, so it shows the result rather than the process. The agent core is a shared codebase, not mine — see the ownership note, which is stated on the page rather than buried here.",

  ownership:
    "Shared project. The agent core is a codebase I worked from, not one I wrote; it also exists in Soumyadeb Tripathy's Raptor-AI repository. Mine is the layer around it: the Next.js dashboard and its WebSocket hook, the three API routes, the automation engine tools, the external automation modules, and the Windows port.",

  stack: [
    "Python 3.11",
    "Next.js 15",
    "TypeScript",
    "WebSocket",
    "Faster-Whisper",
    "OpenWakeWord",
    "Groq · LLaMA 3.1",
    "pyttsx3",
    "Chrome extension",
  ],

  layers: [
    {
      id: "dash",
      name: "Dashboard",
      role: "Mine. Live agent state, last command, active module and health, over a single typed socket hook.",
      modules: ["frontend/src/hooks/useRaptorSocket.ts", "frontend/src/components/RaptorVisualizer.tsx", "frontend/src/components/StateIndicator.tsx"],
      depth: 4,
    },
    {
      id: "routes",
      name: "Control API",
      role: "Mine. Next.js route handlers to start the agent, read its status and mint a session token.",
      modules: ["frontend/src/app/api/raptor/start/route.ts", "frontend/src/app/api/raptor/status/route.ts"],
      depth: 3,
    },
    {
      id: "automation",
      name: "Automation engine",
      role: "Mine. Browser, network and system tools the executor dispatches to.",
      modules: ["core/tools/automation_engine/browser_tool.py", "core/tools/automation_engine/network_tool.py", "core/tools/automation_engine/system_tool.py"],
      depth: 2,
    },
    {
      id: "external",
      name: "External modules",
      role: "Mine. Standalone utilities — network scanning, system inspection, GitHub statistics.",
      modules: ["external_modules/automation_script/nmap_network_scanner.py", "external_modules/automation_script/system_info.py"],
      depth: 1,
    },
    {
      id: "core",
      name: "Agent core",
      role: "Shared, not mine. Wake listener, planner, executor, learning engine and the WebSocket bridge I publish through.",
      modules: ["voice_agent_core/core/planner.py", "voice_agent_core/core/executor.py", "voice_agent_core/core/ws_bridge.py"],
      depth: 0,
    },
  ],

  readings: [
    {
      id: "sf-dash",
      value: "5",
      label: "Dashboard components · mine",
      detail:
        "ActiveAgent, CommandPanel, ModuleDisplay, RaptorVisualizer and StateIndicator, plus the socket hook that feeds them.",
      confidence: "measured",
      samples: [
        { label: "frontend/src/components", href: `${REPO}/tree/main/frontend/src/components`, kind: "code", measuredAt: M },
        { label: "useRaptorSocket.ts", href: `${REPO}/blob/main/frontend/src/hooks/useRaptorSocket.ts`, kind: "code", measuredAt: M },
      ],
    },
    {
      id: "sf-tools",
      value: "3",
      label: "Automation tools · mine",
      detail: "Browser, network and system tools added to the executor's dispatch table.",
      confidence: "measured",
      samples: [{ label: "core/tools/automation_engine", href: `${REPO}/tree/main/core/tools/automation_engine`, kind: "code", measuredAt: M }],
    },
    {
      id: "sf-core",
      value: "shared",
      label: "Agent core · not mine",
      detail:
        "The pipeline modules also exist in Rexy-5097/Raptor-AI. Stated here rather than claimed.",
      confidence: "attributed",
      samples: [
        { label: "voice_agent_core/core", href: `${REPO}/tree/main/voice_agent_core/core`, kind: "code", measuredAt: M },
        { label: "Rexy-5097/Raptor-AI", href: "https://github.com/Rexy-5097/Raptor-AI", kind: "code", measuredAt: M },
      ],
    },
  ],

  decisions: [
    {
      id: "sf-adr-snapshot",
      title: "Every socket message is a full snapshot, not a delta",
      context:
        "The dashboard can be opened at any point in the agent's life, and a dropped connection means missed messages.",
      options: [
        { option: "Send deltas", rejected: true, reason: "A client that missed one message is permanently wrong, with no way to detect it." },
        { option: "Replay an event log on connect", rejected: true, reason: "Forces the agent to retain history it has no other reason to keep." },
        { option: "Send the whole state on every change", rejected: false, reason: "Any client converges on the next message, whenever it arrives." },
      ],
      decision: "The bridge publishes a complete state object; the hook replaces rather than merges.",
      consequence:
        "Slightly larger messages, at a rate a human generates. In exchange, reconnection needs no special case at all.",
    },
  ],

  links: [
    { label: "REPOSITORY", href: REPO },
    { label: "COMMITS", href: `${REPO}/commits/main` },
  ],

  year: "2026",
  confidence: "attributed",
};

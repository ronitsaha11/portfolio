import type { Scene } from "../types";

const REPO = "https://github.com/ronitsaha11/TerramindAI";
const BLOB = `${REPO}/blob/main`;
const M = "2026-09-20";

/**
 * The specification baseline is pinned to the commit that added it, not
 * to `main`. The volumes were later removed from the default branch,
 * and the branch-relative link this site used to ship had been a 404
 * for weeks while the page went on rendering the figure it supported.
 * Evidence that has to survive gets a commit SHA.
 */
const SPEC_COMMIT = "9a623cb535e66f5d210879bdc776968d3278a17f";
const SPECS = `${REPO}/tree/${SPEC_COMMIT}/docs/living-earth/specifications`;

export const terramind: Scene = {
  slug: "terramind",
  sceneNumber: 3,
  name: "TerraMind AI",
  subtitle: "Earth intelligence platform",
  category: "Geospatial · Platform",
  tier: "flagship",
  oneLiner:
    "Satellite scenes in, segmented geometry and spectral statistics out — with a job platform underneath so nothing blocks a request.",

  status:
    "Not deployed. Ruff, mypy and pytest all gate a push since August 2026; the specification volumes have been removed from the default branch and survive only in history."
,

  problem:
    "Running a segmentation model over a satellite scene takes minutes, not milliseconds. Any design that treats it as a request/response call is broken before it ships: the request times out, the work is lost, and there is no record that it ever happened. The real problem was never the model — it was everything around it.",

  invariant:
    "A unit of work either completes and is recorded, or it fails and is recorded. There is no third state where analysis happened but nothing knows about it.",

  approach:
    "The backend is layered strictly by responsibility. Routers hold no logic; they call services, services call repositories, and nine repositories sit behind a single Unit of Work that hands every one of them the same async session — so a request commits as one transaction or rolls back as one. Long work never runs inline: it is dispatched to Celery, tracked as a database row through a job lifecycle, and its result is written back with a lineage record attached. External services — the STAC catalogue, the tile server, the segmentation model — each sit behind a base interface, so adding a second provider is a registration rather than a rewrite. The client is a MapLibre globe with a deck.gl overlay, a store per domain, and an adapter between the two so interaction handling reaches into neither.",

  hardPart: {
    title: "Making a job something the database knows about",
    body:
      "Celery will happily run a task and hand you a result id, and for about a week that feels like it solves the problem. It does not, because the result backend is not the system of record: restart the broker and the work is gone with no trace that it was ever requested, and there is nowhere to put the question a user actually asks, which is what happened to the thing I submitted an hour ago. So a job is a row. Job is a real table with a type, a status enum, a priority and separate submitted, started and completed timestamps, foreign-keyed to the project and region it belongs to — which means a queued job, a running job and a job that died mid-flight are all distinguishable after a restart, and the audit log has something to point at. The store itself sits behind JobStoreProtocol, with an in-memory implementation beside the Redis one, so the lifecycle is testable without standing up a broker. The hard part was declining the version that worked immediately.",
  },

  limitation:
    "It is not deployed. The nine specification volumes are also no longer on the default branch — they exist only in the commit that added them, which is why the link here is pinned to that SHA rather than to `main`. Until recently this site also said pytest was commented out in CI; that was fixed in August and the claim here was stale, which is exactly the failure the site exists to argue against.",

  ownership:
    "Sole author. All 116 commits, no co-authors, no merged forks.",

  stack: [
    "Python 3.11",
    "FastAPI",
    "SQLAlchemy (async)",
    "PostgreSQL + PostGIS",
    "Celery",
    "Redis",
    "Alembic",
    "PyTorch",
    "React 19",
    "TypeScript",
    "deck.gl 9",
    "MapLibre GL",
    "Zustand",
    "Vite",
  ],

  layers: [
    {
      id: "api",
      name: "API",
      role: "Versioned routers with no business logic. Dependency-injected, typed request and response schemas.",
      modules: ["src/api/v1/router.py", "src/api/v1/analysis.py", "src/api/dependencies.py"],
      depth: 4,
    },
    {
      id: "service",
      name: "Services",
      role: "Orchestration. Decides what happens; owns no persistence and no HTTP.",
      modules: ["src/services/analysis_service.py", "src/services/catalog_service.py", "src/services/tile_service.py"],
      depth: 3,
    },
    {
      id: "uow",
      name: "Unit of Work",
      role: "Transaction boundary. Nine repositories share one async session so a request commits or rolls back as a single unit.",
      modules: ["src/unit_of_work.py", "src/repositories/base.py"],
      depth: 2,
    },
    {
      id: "async",
      name: "Job platform",
      role: "Celery app, task registry, Redis-backed job store. Jobs are first-class rows, not fire-and-forget.",
      modules: ["src/async_processing/service.py", "src/async_processing/redis_store.py", "src/async_processing/tasks/ai_tasks.py"],
      depth: 1,
    },
    {
      id: "ai",
      name: "Inference",
      role: "Provider registry with a loader and a tensor pre/post-processing pipeline. A second model is a registration.",
      modules: ["src/ai/registry.py", "src/ai/providers/segformer.py", "src/ai/processing/preprocessor.py"],
      depth: 1,
    },
    {
      id: "geo",
      name: "Geospatial",
      role: "Raster polygonisation, geometry processing, GeoJSON export, spectral indices and zonal statistics.",
      modules: ["src/geospatial/polygonizer.py", "src/analytics/indices/ndvi.py", "src/analytics/statistics/engine.py"],
      depth: 0,
    },
  ],

  signature: {
    formation: "stack",
    ramp: 3,
    nodes: 200,
    stages: [
      { id: "api", label: "API", note: "Versioned routers holding no business logic." },
      { id: "service", label: "Services", note: "Orchestration. Owns no persistence and no HTTP." },
      {
        id: "uow",
        label: "Unit of Work",
        note: "The transaction boundary. Nine repositories share one async session — a request commits or rolls back as one.",
        boundary: true,
      },
      { id: "async", label: "Job platform", note: "Celery and a Redis-backed store. Jobs are database rows, not fire-and-forget." },
      { id: "ai", label: "Inference", note: "A provider registry. A second model is a registration, not a rewrite." },
      { id: "geo", label: "Geospatial", note: "Polygonisation, spectral indices and zonal statistics." },
    ],
  },

  readings: [
    {
      id: "tm-commits",
      value: "116",
      label: "Commits · sole author",
      detail:
        "Every commit on TerramindAI is authored by ronitsaha11. No co-authors, no merges from forks.",
      confidence: "measured",
      samples: [
        { label: "Contributors → one entry", href: `${REPO}/graphs/contributors`, kind: "api", measuredAt: M },
        { label: "Commit history, Jul–Aug 2026", href: `${REPO}/commits/main`, kind: "commit", measuredAt: M },
      ],
    },
    {
      id: "tm-files",
      value: "464",
      label: "Tracked source files",
      detail:
        "Blobs in the main tree. It was 562 in August; a cleanup pass removed the rest, and this figure follows the repository rather than the other way round.",
      confidence: "measured",
      samples: [{ label: "Repository tree", href: REPO, kind: "api", measuredAt: M }],
    },
    {
      id: "tm-tests",
      value: "45",
      label: "Test modules · gating CI",
      detail:
        "Unit and integration suites across the AI, analytics, async-processing and geospatial subsystems. The suite is hermetic — no test opens a real PostgreSQL or Redis connection — and `pytest` runs on every push.",
      confidence: "measured",
      samples: [
        { label: "apps/backend/tests", href: `${REPO}/tree/main/apps/backend/tests`, kind: "code", measuredAt: M },
        { label: "ci.yml — ruff, mypy, pytest", href: `${BLOB}/.github/workflows/ci.yml`, kind: "ci", measuredAt: M },
      ],
    },
    {
      id: "tm-specs",
      value: "9",
      label: "Specification volumes",
      detail:
        "Volumes I to IX, committed before the code they describe and implemented against. They are no longer on `main`, so this links the commit that added them.",
      confidence: "measured",
      samples: [
        { label: "Volumes I–IX, pinned at 9a623cb", href: SPECS, kind: "doc", measuredAt: M },
        { label: "The commit that added them", href: `${REPO}/commit/${SPEC_COMMIT}`, kind: "commit", measuredAt: M },
      ],
    },
  ],

  decisions: [
    {
      id: "tm-adr-uow",
      title: "One session per request, shared by every repository",
      context:
        "Nine repositories each need database access inside a single request. If each opens its own session, a request that writes a project, a job and an audit log can half-succeed — leaving a job with no audit trail.",
      options: [
        { option: "A session per repository", rejected: true, reason: "No shared transaction boundary; partial writes become possible and invisible." },
        { option: "A session passed manually through every call", rejected: true, reason: "Works, but every new service has to remember to do it. A convention is not an invariant." },
        { option: "A Unit of Work that constructs the repositories", rejected: false, reason: "The boundary is structural — repositories cannot be built outside a transaction." },
      ],
      decision:
        "UnitOfWork is an async context manager. Entering it opens a session and constructs all nine repositories against it; leaving it rolls back on exception and always closes.",
      consequence:
        "Callers cannot accidentally write outside a transaction. The cost is that every repository must be listed in one place — an acceptable trade for making the invariant impossible to break.",
    },
    {
      id: "tm-adr-jobstore",
      title: "A job is a database row, not a Celery result",
      context:
        "Segmentation over a satellite scene takes minutes. Celery returns a task id immediately and keeps the outcome in its result backend, which is a cache rather than a system of record.",
      options: [
        {
          option: "Use the Celery result backend as the source of truth",
          rejected: true,
          reason: "Restart the broker and every in-flight job disappears, with no record that it was ever submitted.",
        },
        {
          option: "Write a row only once the job finishes",
          rejected: true,
          reason: "Leaves queued and running work invisible, which is exactly the window a user asks about.",
        },
        {
          option: "Model the job as an entity with its own lifecycle, behind a store protocol",
          rejected: false,
          reason: "Queued, running, failed and complete stay distinguishable after a restart, and the store swaps for an in-memory one in tests.",
        },
      ],
      decision:
        "Job is a table with a status enum, a type, a priority and separate submitted, started and completed timestamps. Persistence sits behind JobStoreProtocol, with in-memory and Redis implementations.",
      consequence:
        "Every dispatch costs a write before the work starts. In exchange the lifecycle is queryable, the audit log has a real foreign key to point at, and the job platform can be tested with no broker running.",
    },
  ],

  links: [
    { label: "REPOSITORY", href: REPO },
    { label: "SPECIFICATION", href: SPECS },
    { label: "ROADMAP", href: `${BLOB}/ROADMAP.md` },
    { label: "COMMITS", href: `${REPO}/commits/main` },
  ],

  year: "2026",
  confidence: "measured",
};

export const terramindSource = {
  path: "apps/backend/src/unit_of_work.py",
  href: `${BLOB}/apps/backend/src/unit_of_work.py`,
  /**
   * Verbatim, with the real line numbers. An earlier version of this
   * section paraphrased the file and numbered the lines from memory:
   * every number was wrong, the `if self.session:` guards were missing,
   * and it claimed seven repositories where the file constructs nine.
   * A source excerpt that does not match the source is worse than none,
   * because the whole point is that a reader can go and check.
   */
  lines: [
    { n: 18, code: "class UnitOfWork:", note: null },
    {
      n: 27,
      code: '    async def __aenter__(self) -> "UnitOfWork":',
      note: "An async context manager, so the transaction boundary is the language's rather than a convention someone has to remember.",
    },
    { n: 28, code: "        self.session = self.session_factory()", note: null },
    {
      n: 31,
      code: "        self.users = UserRepository(self.session)",
      note: "Every repository is constructed here, against the same session. There is no way to obtain one outside the boundary.",
    },
    { n: 32, code: "        self.projects = ProjectRepository(self.session)", note: null },
    { n: 36, code: "        self.jobs = JobRepository(self.session)", note: null },
    {
      n: 39,
      code: "        self.audit_logs = AuditLogRepository(self.session)",
      note: "Nine in total. A request that writes a project, a job and an audit log commits all three or none.",
    },
    { n: 49, code: "        if self.session:", note: null },
    {
      n: 50,
      code: "            if exc_type is not None:",
      note: "Exit rolls back on any exception and always closes — the caller cannot leak a session by forgetting.",
    },
    { n: 51, code: "                await self.rollback()", note: null },
    { n: 52, code: "            await self.session.close()", note: null },
  ],
};

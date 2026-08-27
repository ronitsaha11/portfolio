import type { Scene } from "../types";

const REPO = "https://github.com/ronitsaha11/TerramindAI";
const BLOB = `${REPO}/blob/main`;
const M = "2026-08-27";

export const terramind: Scene = {
  slug: "terramind",
  sceneNumber: 1,
  name: "TerraMind AI",
  subtitle: "Earth intelligence platform",
  oneLiner:
    "Satellite scenes in, segmented geometry and spectral statistics out — with a job platform underneath so nothing blocks a request.",

  problem:
    "Running a segmentation model over a satellite scene takes minutes, not milliseconds. Any design that treats it as a request/response call is broken before it ships: the request times out, the work is lost, and there is no record that it ever happened. The real problem was never the model — it was everything around it.",

  invariant:
    "A unit of work either completes and is recorded, or it fails and is recorded. There is no third state where analysis happened but nothing knows about it.",

  approach:
    "The backend is layered strictly by responsibility. Routers hold no logic; they call services, services call repositories, and seven repositories sit behind a single Unit of Work that hands every one of them the same async session — so a request commits as one transaction or rolls back as one. Long work never runs inline: it is dispatched to Celery, tracked as a database row through a job lifecycle, and its result is written back with a lineage record attached. External services — the STAC catalogue, the tile server, the segmentation model — each sit behind a base interface, so adding a second provider is a registration rather than a rewrite.",

  hardPart: {
    title: "The adaptive performance governor",
    body: "The client renders results on a globe built as its own engine — a simulation clock, an Earth reference frame with real ephemeris so the sun position is computed rather than faked, terrain elevation decoded from DEM tiles, and a streaming cache with an eviction policy. Under load, the naive outcome is dropped frames. Instead a governor watches a rolling average of frame time through a hysteresis model and steps visual quality down before the budget is missed — then steps it back up once the average recovers. Hysteresis is the part that matters: without it the quality level oscillates every few frames, which looks far worse than simply running at low quality. Degrade, don't fail.",
  },

  limitation:
    "It is not deployed. Roughly fifty test modules exist but pytest is still commented out in the CI workflow, so the suite does not gate a push — the single most misleading thing about the repository as it stands. Both are on the list to fix, and neither is hidden here.",

  ownership:
    "Sole author. All 90 commits, no co-authors, no merged forks.",

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
      role: "Transaction boundary. Seven repositories share one async session so a request commits or rolls back as a single unit.",
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

  readings: [
    {
      id: "tm-commits",
      value: "90",
      label: "Commits · sole author",
      detail:
        "Every commit on TerramindAI is authored by ronitsaha11. No co-authors, no merges from forks.",
      confidence: "measured",
      samples: [
        { label: "Contributors → one entry", href: `${REPO}/graphs/contributors`, kind: "api", measuredAt: M },
        { label: "Commit history, 24–28 Jul 2026", href: `${REPO}/commits/main`, kind: "commit", measuredAt: M },
      ],
    },
    {
      id: "tm-files",
      value: "562",
      label: "Tracked source files",
      detail: "Blobs in the main tree, excluding node_modules and build output.",
      confidence: "measured",
      samples: [{ label: "Repository tree", href: REPO, kind: "api", measuredAt: M }],
    },
    {
      id: "tm-tests",
      value: "50",
      label: "Test modules",
      detail:
        "Unit and integration suites across the AI, analytics, async-processing and geospatial subsystems.",
      confidence: "measured",
      samples: [{ label: "apps/backend/tests", href: `${REPO}/tree/main/apps/backend/tests`, kind: "code", measuredAt: M }],
    },
    {
      id: "tm-specs",
      value: "9",
      label: "Specification volumes",
      detail:
        "Architecture documents committed before the code they describe, then implemented against.",
      confidence: "measured",
      samples: [
        { label: "docs/living-earth/specifications", href: `${REPO}/tree/main/docs/living-earth/specifications`, kind: "doc", measuredAt: M },
      ],
    },
  ],

  decisions: [
    {
      id: "tm-adr-uow",
      title: "One session per request, shared by every repository",
      context:
        "Seven repositories each need database access inside a single request. If each opens its own session, a request that writes a project, a job and an audit log can half-succeed — leaving a job with no audit trail.",
      options: [
        { option: "A session per repository", rejected: true, reason: "No shared transaction boundary; partial writes become possible and invisible." },
        { option: "A session passed manually through every call", rejected: true, reason: "Works, but every new service has to remember to do it. A convention is not an invariant." },
        { option: "A Unit of Work that constructs the repositories", rejected: false, reason: "The boundary is structural — repositories cannot be built outside a transaction." },
      ],
      decision:
        "UnitOfWork is an async context manager. Entering it opens a session and constructs all seven repositories against it; leaving it rolls back on exception and always closes.",
      consequence:
        "Callers cannot accidentally write outside a transaction. The cost is that every repository must be listed in one place — an acceptable trade for making the invariant impossible to break.",
    },
    {
      id: "tm-adr-governor",
      title: "Hysteresis on quality changes, not a raw threshold",
      context:
        "The globe must hold its frame budget on a mid-range laptop while streaming terrain tiles, atmosphere, clouds and night lights.",
      options: [
        { option: "Drop frames and let the browser cope", rejected: true, reason: "Stutter is the most visible possible failure." },
        { option: "Step quality on an instantaneous frame-time threshold", rejected: true, reason: "The level oscillates every few frames near the boundary — worse than simply running low." },
        { option: "Rolling average plus hysteresis band", rejected: false, reason: "Quality changes are rare, decisive and stable." },
      ],
      decision:
        "A governor reads a rolling average of frame time and only changes level when it crosses a band with separate step-down and step-up thresholds.",
      consequence:
        "Visual quality varies with hardware instead of frame rate varying with hardware. A slow machine gets a simpler globe, not a broken one.",
    },
  ],

  links: [
    { label: "REPOSITORY", href: REPO },
    { label: "SPECIFICATION", href: `${REPO}/tree/main/docs/living-earth/specifications` },
    { label: "COMMITS", href: `${REPO}/commits/main` },
  ],

  year: "2026",
  confidence: "measured",
};

export const terramindSource = {
  path: "apps/backend/src/unit_of_work.py",
  href: `${BLOB}/apps/backend/src/unit_of_work.py`,
  lines: [
    { n: 14, code: "class UnitOfWork:", note: null },
    { n: 21, code: "    async def __aenter__(self) -> \"UnitOfWork\":", note: "An async context manager, so the transaction boundary is the language's, not a convention." },
    { n: 22, code: "        self.session = self.session_factory()", note: null },
    { n: 25, code: "        self.users = UserRepository(self.session)", note: "Every repository is constructed here, against the same session. There is no way to obtain one outside the boundary." },
    { n: 26, code: "        self.projects = ProjectRepository(self.session)", note: null },
    { n: 31, code: "        self.audit_logs = AuditLogRepository(self.session)", note: null },
    { n: 42, code: "        if exc_type is not None:", note: "Exit rolls back on any exception and always closes — the caller cannot leak a session by forgetting." },
    { n: 43, code: "            await self.rollback()", note: null },
    { n: 44, code: "        await self.session.close()", note: null },
  ],
};

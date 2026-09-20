import type { Capability } from "./types";

const TM = "https://github.com/ronitsaha11/TerramindAI";
const TMB = `${TM}/blob/main/apps/backend/src`;
const TMF = `${TM}/blob/main/frontend/src`;
const HT = "https://github.com/ronitsaha11/HealthTrack/blob/master/app/src/main/java/com/healthtrack";
const ES = "https://github.com/Somnath29/EcoShare/blob/main";
const SF = "https://github.com/ronitsaha11/Stealth-FRIDAY/blob/main";
const EB = "https://github.com/ronitsaha11/ecobites-food-waste-management/blob/main/backend/src/main/java/com/foodwaste/app";
const CG = "https://github.com/Rexy-5097/cartograph";
const PB = "https://github.com/ronitsaha11/pratibimb";

/**
 * Only technologies that appear in code Ronit wrote. Every item links to
 * the file that proves it — no self-rated bars, no logo walls.
 */
export const capabilities: Capability[] = [
  {
    group: "Backend",
    items: [
      { name: "FastAPI", note: "versioned routers, DI", href: `${TMB}/api/v1/router.py` },
      { name: "SQLAlchemy async", note: "repository layer", href: `${TMB}/repositories/base.py` },
      { name: "Unit of Work", note: "transaction boundary", href: `${TMB}/unit_of_work.py` },
      { name: "Celery + Redis", note: "job platform", href: `${TMB}/async_processing/service.py` },
      { name: "Alembic", note: "schema migrations", href: `${TM}/blob/main/apps/backend/alembic/versions/20260725_01_initial_schema.py` },
      { name: "Spring Boot", note: "11 controllers", href: `${EB}/controller/DonationController.java` },
      { name: "Express", note: "listing endpoints", href: `${ES}/backend/src/controllers/foodController.ts` },
    ],
  },
  {
    group: "Architecture",
    items: [
      { name: "Provider registry", note: "pluggable models", href: `${TMB}/ai/registry.py` },
      { name: "Adapter boundary", note: "renderer-independent", href: `${TMF}/core/datasets/contracts/renderer.interface.ts` },
      { name: "Clean Architecture", note: "data / domain / ui", href: `${HT}/domain/repository/ReminderRepository.kt` },
      { name: "State machine", note: "reminder lifecycle", href: `${HT}/domain/statemachine/ReminderStateMachine.kt` },
      { name: "Audit + lineage", note: "provenance as a model", href: `${TMB}/db/models/lineage_record.py` },
      { name: "Global exception handling", note: "one error contract", href: `${EB}/exception/GlobalExceptionHandler.java` },
    ],
  },
  {
    group: "Geospatial & ML",
    items: [
      { name: "deck.gl overlay", note: "on a MapLibre globe", href: `${TMF}/features/earth/services/DeckOverlayManager.ts` },
      { name: "STAC / Earth Search", note: "scene discovery", href: `${TMB}/providers/catalog/earth_search.py` },
      { name: "TiTiler + COG", note: "tile serving", href: `${TMB}/providers/tiles/titiler.py` },
      { name: "NDVI / NDWI", note: "own index engine", href: `${TMB}/analytics/indices/ndvi.py` },
      { name: "SegFormer", note: "segmentation provider", href: `${TMB}/ai/providers/segformer.py` },
      { name: "Raster polygonisation", note: "mask → GeoJSON", href: `${TMB}/geospatial/polygonizer.py` },
      { name: "Terrain config", note: "DEM source and exaggeration", href: `${TMF}/features/earth/config/terrain.config.ts` },
      { name: "Projection service", note: "globe / mercator switch", href: `${TMF}/features/earth/services/ProjectionService.ts` },
    ],
  },
  {
    group: "Frontend",
    items: [
      { name: "React 19", note: "workspace shell", href: `${TMF}/layouts/WorkspaceLayout.tsx` },
      { name: "Zustand", note: "store per domain", href: `${TMF}/features/earth/stores/useLayerStore.ts` },
      { name: "TanStack Query", note: "server state", href: `${TMF}/lib/queryClient.ts` },
      { name: "Command palette", note: "cmdk + registry", href: `${TMF}/components/command/CommandPalette.tsx` },
      { name: "Next.js", note: "agent dashboard", href: `${SF}/frontend/src/app/page.tsx` },
      { name: "WebSocket client", note: "live agent state", href: `${SF}/frontend/src/hooks/useRaptorSocket.ts` },
      { name: "Error boundaries", note: "feedback layer", href: `${TMF}/components/feedback/ErrorBoundary.tsx` },
    ],
  },
  {
    group: "Mobile",
    items: [
      { name: "Jetpack Compose", note: "full UI", href: `${HT}/presentation/analytics/AnalyticsScreen.kt` },
      { name: "Hilt", note: "6 modules by concern", href: `${HT}/di/DatabaseModule.kt` },
      { name: "Room", note: "5 DAOs, source of truth", href: `${HT}/data/local/HealthTrackDatabase.kt` },
      { name: "WorkManager", note: "6 durable workers", href: `${HT}/data/worker/RescheduleRemindersWorker.kt` },
      { name: "AlarmManager", note: "exact scheduling", href: `${HT}/data/scheduler/AlarmSchedulerImpl.kt` },
      { name: "Health Connect", note: "vitals ingest", href: `${HT}/data/health/HealthConnectManager.kt` },
      { name: "Firestore sync", note: "offline-first", href: `${HT}/data/repository/FirestoreSyncRepository.kt` },
    ],
  },
  {
    group: "Rendering & interaction",
    items: [
      { name: "Layer lifecycle", note: "add / update / dispose", href: `${TMF}/features/earth/services/layer-lifecycle-manager.ts` },
      { name: "Style compiler", note: "expressions to MapLibre", href: `${TMF}/features/earth/services/style-expression-compiler.ts` },
      { name: "Viewport queries", note: "spatial query controller", href: `${TMF}/features/earth/services/viewport-query-controller.ts` },
      { name: "FPS tracking", note: "rolling average", href: `${TMF}/features/earth/services/FPSTracker.ts` },
    ],
  },
  {
    group: "Rust & static analysis",
    items: [
      { name: "Tauri v2", note: "desktop shell, M11", href: `${CG}/tree/main/desktop/src-tauri` },
      { name: "petgraph traversal", note: "blast radius, M12", href: `${CG}/tree/main/crates/cartograph-graph` },
      { name: "Structural diff", note: "branch vs branch, M13", href: `${CG}/tree/main/crates/cartograph-graph` },
      { name: "Model Context Protocol", note: "stdio server, M15", href: `${CG}/tree/main/crates/cartograph-mcp` },
      { name: "Sigma / Graphology", note: "graph renderer", href: `${CG}/blob/main/desktop/src/GraphView.tsx` },
      { name: "Evidence bundles", note: "the ASK boundary, M16", href: `${CG}/tree/main/crates/cartograph-ask` },
    ],
  },
  {
    group: "Privacy & on-device ML",
    items: [
      { name: "Security invariants", note: "25, frozen, ADR-gated", href: `${PB}/blob/main/docs/security/security-invariants.md` },
      { name: "Threat modelling", note: "four adversaries, scoped", href: `${PB}/blob/main/docs/security/threat-model.md` },
      { name: "Redaction manifest", note: "typed placeholders, v1.1", href: `${PB}/blob/main/docs/architecture/manifest-schema.md` },
      { name: "ONNX Runtime Web", note: "hash-pinned wasm asset", href: `${PB}/blob/main/packages/security/src/ortRuntimePin.ts` },
      { name: "Chrome MV3", note: "offscreen inference host", href: `${PB}/tree/main/apps/extension` },
      { name: "Evaluation harness", note: "built week two, not six", href: `${PB}/tree/main/packages/evaluation` },
    ],
  },
  {
    group: "Quality & delivery",
    items: [
      { name: "GitHub Actions", note: "lint + types on push", href: `${TM}/blob/main/.github/workflows/ci.yml` },
      { name: "mypy", note: "strict, on src/", href: `${TM}/blob/main/.github/workflows/ci.yml` },
      { name: "Ruff", note: "lint + format gate", href: `${TM}/blob/main/.github/workflows/ci.yml` },
      { name: "pytest", note: "~50 modules", href: `${TM}/tree/main/apps/backend/tests` },
      { name: "Docker Compose", note: "Postgres + Redis", href: `${TM}/blob/main/docker-compose.yml` },
      { name: "Vercel", note: "SPA routing", href: `${ES}/frontend/vercel.json` },
      { name: "Vitest", note: "806 tests, two machines", href: `${PB}/blob/main/vitest.config.ts` },
      { name: "Quality gates", note: "QG-01..06, signed or not", href: `${PB}/tree/main/agentos/gates` },
      { name: "Pre-registered spikes", note: "criteria before data", href: `${PB}/tree/main/artifacts/experiments` },
      { name: "clippy -D warnings", note: "the same gates CI runs", href: `${CG}/blob/main/Makefile` },
    ],
  },
];

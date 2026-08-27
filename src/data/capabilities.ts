import type { Capability } from "./types";

const TM = "https://github.com/ronitsaha11/TerramindAI";
const TMB = `${TM}/blob/main/apps/backend/src`;
const TMF = `${TM}/blob/main/frontend/src`;
const HT = "https://github.com/ronitsaha11/HealthTrack/blob/master/app/src/main/java/com/healthtrack";
const ES = "https://github.com/Somnath29/EcoShare/blob/main";
const SF = "https://github.com/ronitsaha11/Stealth-FRIDAY/blob/main";
const EB = "https://github.com/ronitsaha11/ecobites-food-waste-management/blob/main/backend/src/main/java/com/foodwaste/app";

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
      { name: "Adapter boundary", note: "renderer-independent", href: `${TMF}/features/rendering/RendererAdapter.ts` },
      { name: "Clean Architecture", note: "data / domain / ui", href: `${HT}/domain/repository/ReminderRepository.kt` },
      { name: "State machine", note: "reminder lifecycle", href: `${HT}/domain/statemachine/ReminderStateMachine.kt` },
      { name: "Audit + lineage", note: "provenance as a model", href: `${TMB}/db/models/lineage_record.py` },
      { name: "Global exception handling", note: "one error contract", href: `${EB}/exception/GlobalExceptionHandler.java` },
    ],
  },
  {
    group: "Geospatial & ML",
    items: [
      { name: "deck.gl 9", note: "globe layers", href: `${TMF}/features/rendering/layers/GlobeLayerFactory.ts` },
      { name: "STAC / Earth Search", note: "scene discovery", href: `${TMB}/providers/catalog/earth_search.py` },
      { name: "TiTiler + COG", note: "tile serving", href: `${TMB}/providers/tiles/titiler.py` },
      { name: "NDVI / NDWI", note: "own index engine", href: `${TMB}/analytics/indices/ndvi.py` },
      { name: "SegFormer", note: "segmentation provider", href: `${TMB}/ai/providers/segformer.py` },
      { name: "Raster polygonisation", note: "mask → GeoJSON", href: `${TMB}/geospatial/polygonizer.py` },
      { name: "DEM elevation", note: "terrain decoding", href: `${TMF}/features/terrain/ElevationDecoder.ts` },
      { name: "Ephemeris", note: "real sun position", href: `${TMF}/core/planet/EarthEphemeris.ts` },
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
    group: "Performance",
    items: [
      { name: "Adaptive governor", note: "quality, not frames", href: `${TMF}/features/performance/PerformanceEngine.ts` },
      { name: "Hysteresis model", note: "no oscillation", href: `${TMF}/features/performance/models/HysteresisModel.ts` },
      { name: "Streaming cache", note: "tile eviction policy", href: `${TMF}/features/streaming/StreamingEngine.ts` },
      { name: "FPS tracking", note: "rolling average", href: `${TMF}/features/earth/services/FPSTracker.ts` },
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
    ],
  },
];

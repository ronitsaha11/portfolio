import type { LatticePose } from "./state";
import type { Scene } from "@/data/types";

/**
 * CINEMATOGRAPHY, PER SYSTEM.
 *
 * Six projects, six shots. A page where every case study is the same
 * object seen from the same distance has one visual idea repeated six
 * times, and the reader stops looking after the second. So each
 * formation gets a camera chosen for what that shape is *about*:
 *
 *   pipeline    from the side and low, travelling along the chain, so
 *               the twelve stages pass the viewport in order and the
 *               gate arrives as an event
 *   crossstack  turned in perspective, because the whole claim of the
 *               system is that the tiers are separate and the edges
 *               cross between them
 *   stack       high and oblique, looking down at tiled sheets. This is
 *               the geospatial one, and it should read as a survey
 *               overflight without being a globe
 *   orbit       wide, with the largest yaw on the page, so the rings
 *               sweep past a core that stays put
 *   ledger      slightly above the rows, receding into depth, which is
 *               what a record you can scroll back through looks like
 *   mesh        flat on and slowly turning: no centre, no privileged
 *               viewpoint, which is the point of a mesh
 *
 * None of this is data. It is the shot list, it lives here rather than
 * in `src/data`, and a project file never carries a camera angle.
 */

export type Shot = Omit<LatticePose, "formation" | "boundary" | "boundaryGroup" | "presence">;

export const SHOTS: Record<string, Shot> = {
  pipeline: {
    camX: 0,
    camY: 0.5,
    camZ: 16,
    lookY: 0,
    spin: 0.34,
    dolly: 6.5,
    swing: 0.26,
    nodeScale: 1,
    edgeOpacity: 0.3,
    corridor: 0.52,
    flow: 1,
    glow: 1.2,
  },
  crossstack: {
    camX: 0,
    camY: 1.1,
    camZ: 15,
    lookY: -0.2,
    spin: 0.52,
    dolly: 5.2,
    swing: 0.42,
    nodeScale: 1,
    edgeOpacity: 0.34,
    corridor: 0.52,
    flow: 0.85,
    glow: 1.15,
  },
  stack: {
    camX: 0,
    camY: 5.6,
    camZ: 12.5,
    lookY: -1.1,
    spin: 0.26,
    dolly: 4.6,
    swing: 0.3,
    nodeScale: 0.92,
    edgeOpacity: 0.24,
    corridor: 0.52,
    flow: 0.6,
    glow: 1.05,
  },
  orbit: {
    camX: 0,
    camY: 2.2,
    camZ: 16,
    lookY: -0.3,
    spin: 0.2,
    dolly: 5,
    swing: 0.62,
    nodeScale: 0.9,
    edgeOpacity: 0.28,
    corridor: 0.52,
    flow: 0.7,
    glow: 1,
  },
  ledger: {
    camX: 0,
    camY: 3.2,
    camZ: 15,
    lookY: -0.6,
    spin: 0.1,
    dolly: 4.2,
    swing: 0.12,
    nodeScale: 0.82,
    edgeOpacity: 0.22,
    corridor: 0.52,
    flow: 0.5,
    glow: 0.95,
  },
  mesh: {
    camX: 0,
    camY: 0,
    camZ: 17,
    lookY: 0,
    spin: 0.4,
    dolly: 4.4,
    swing: 0.46,
    nodeScale: 0.88,
    edgeOpacity: 0.26,
    corridor: 0.52,
    flow: 0.75,
    glow: 1,
  },
};

export const FALLBACK_SHOT: Shot = SHOTS.mesh!;

export function scenePose(scene: Scene): LatticePose {
  const shot = SHOTS[scene.signature.formation] ?? FALLBACK_SHOT;
  const boundaryIndex = scene.signature.stages.findIndex((s) => s.boundary);
  const flagship = scene.tier === "flagship";

  return {
    ...shot,
    formation: scene.signature.formation,
    // Every case study drives its own camera from its own pinned
    // scroll range. The director performs the formation morph on
    // arrival and then leaves the rig alone; see `sceneShots.ts` for
    // the act timeline that takes over.
    driven: true,
    // A flagship gets more of the frame because its formation is the
    // one doing narrative work. A supporting scene still gets a real
    // shot; it just does not take the page over.
    presence: flagship ? 0.82 : 0.56,
    flow: (shot.flow ?? 0.6) * (flagship ? 1 : 0.7),
    glow: (shot.glow ?? 1) * (flagship ? 1 : 0.88),
    boundary: boundaryIndex >= 0 ? 1 : 0,
    boundaryGroup: Math.max(boundaryIndex, 0),
  };
}

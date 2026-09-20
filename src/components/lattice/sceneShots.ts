import { createTimeline, type Timeline } from "animejs";
import { EASE, type ActPlan } from "@/lib/motion";
import { GROUPS, type FormationName } from "./formations";
import { FALLBACK_SHOT, SHOTS } from "./scenePose";
import type { LatticeState } from "./state";
import type { Scene } from "@/data/types";

/**
 * THE ACT TIMELINE — one camera move per project, scrubbed by scroll.
 *
 * This is the piece that makes the DOM and the 3D one system rather
 * than two. A case study's pinned range produces a single number; the
 * act machine spends it on which paragraph is on screen, and this
 * spends the *same* number on where the camera is, how bright the
 * scene is, whether the gate is drawn and how much of the frame the
 * lattice is allowed to take. There is no second clock and no
 * synchronisation problem, because there is only one value.
 *
 * WHY A PAUSED anime TIMELINE AND NOT A PILE OF `lerp` CALLS
 *
 * A timeline is authored as waypoints and read as a playhead. Once it
 * exists, `seek(progress × duration)` is the entire per-frame cost, and
 * anime does the interpolation, the easing and the ordering. Written by
 * hand it would be a switch over act indices with a lerp per field per
 * act — the same thing, spelled worse, and impossible to retime.
 *
 * It is built ONCE per scene and never rebuilt. Every tween carries
 * explicit `[from, to]` pairs rather than reading the current value at
 * construction, which is what makes it seekable from any position: a
 * reader who lands mid-page and scrolls up gets the same camera as one
 * who arrived from the top.
 *
 * WHERE THE WAYPOINTS SIT, AND WHY NOT ON THE ACT BOUNDARIES
 *
 * A waypoint on an act's leading edge means the camera arrives as the
 * act begins and then holds still while the reader reads it — the
 * scene stops every time the text starts. The waypoints are at act
 * *centres* instead, so the camera is always mid-move and settles
 * briefly where the reader's attention is. The system act is the one
 * exception: it gets two, because travelling through the system is the
 * act, not a transition into it.
 *
 * THE SYSTEM ACT IS DIFFERENT PER FORMATION, AND THE GEOMETRY DECIDES.
 *
 * A pipeline runs along x, so its system act is a tracking shot with
 * the look target travelling beside the camera. A cross-stack is tiers
 * on y, so its system act descends. Sheets are looked down on, so the
 * camera drops through them. An orbit sweeps. None of this is a style
 * choice per project: it is read off where `formations.ts` actually
 * puts the nodes.
 */

/** Arbitrary scrub length. Progress is always a fraction of it. */
export const SCRUB = 10000;

interface Key {
  camX: number;
  camY: number;
  camZ: number;
  lookX: number;
  lookY: number;
  spin: number;
  nodeScale: number;
  edgeOpacity: number;
  presence: number;
  corridor: number;
  flow: number;
  glow: number;
  boundary: number;
}

interface Waypoint {
  at: number;
  key: Key;
}

function baseKey(scene: Scene): Key {
  const shot = SHOTS[scene.signature.formation] ?? FALLBACK_SHOT;
  return {
    camX: 0,
    camY: shot.camY ?? 0,
    camZ: shot.camZ ?? 16,
    lookX: 0,
    lookY: shot.lookY ?? 0,
    spin: shot.spin ?? 0,
    nodeScale: shot.nodeScale ?? 0.9,
    edgeOpacity: shot.edgeOpacity ?? 0.28,
    presence: 0.7,
    corridor: 0.52,
    flow: 0.7,
    glow: 1.05,
    boundary: 0,
  };
}

/**
 * The arc, act by act.
 *
 *   INTRO         wide. The whole object, far away, quiet.
 *   OVERVIEW      a slow dolly in. The system starts to have parts.
 *   SYSTEM        travel through it. See `systemTravel`.
 *   ARCHITECTURE  lateral, and the edges come up: this act is about
 *                 what is joined to what, not about the nodes.
 *   CHALLENGE     tight, hot and thin. One hard thing, close up.
 *   EVIDENCE      stabilise and stand back. The numbers are the
 *                 subject now and the scene gets out of their way —
 *                 this is the quietest the lattice gets on the page.
 *   RESOLUTION    pull back to the whole system again, brighter than
 *                 the intro, because it is now understood.
 */
function actKey(id: string, b: Key, gate: number): Key {
  switch (id) {
    case "intro":
      return {
        ...b,
        camZ: b.camZ + 8.5,
        camY: b.camY + 1.3,
        spin: b.spin - 0.42,
        nodeScale: b.nodeScale * 0.9,
        edgeOpacity: b.edgeOpacity * 0.62,
        presence: 0.5,
        corridor: 0.42,
        flow: 0.32,
        glow: 0.95,
        boundary: 0,
      };
    case "overview":
      return {
        ...b,
        camZ: b.camZ + 3.4,
        camY: b.camY + 0.5,
        spin: b.spin - 0.16,
        nodeScale: b.nodeScale * 0.97,
        edgeOpacity: b.edgeOpacity * 0.9,
        presence: 0.66,
        corridor: 0.5,
        flow: 0.52,
        glow: 1.05,
        boundary: gate * 0.22,
      };
    case "architecture":
      return {
        ...b,
        camZ: b.camZ - 2.8,
        camY: b.camY - 0.9,
        lookY: b.lookY + 0.25,
        spin: b.spin + 0.58,
        nodeScale: b.nodeScale * 1.02,
        edgeOpacity: b.edgeOpacity * 1.4,
        presence: 0.78,
        corridor: 0.58,
        flow: 0.6,
        glow: 1.1,
        boundary: gate * 0.4,
      };
    case "challenge":
      return {
        ...b,
        camZ: b.camZ - 5.6,
        camY: b.camY * 0.45,
        spin: b.spin + 0.14,
        nodeScale: b.nodeScale * 1.3,
        edgeOpacity: b.edgeOpacity * 0.72,
        presence: 0.56,
        corridor: 0.64,
        flow: 0.4,
        glow: 1.45,
        boundary: gate * 0.15,
      };
    case "evidence":
      return {
        ...b,
        camZ: b.camZ + 1.6,
        camY: b.camY + 0.9,
        spin: b.spin + 0.04,
        nodeScale: b.nodeScale * 0.84,
        edgeOpacity: b.edgeOpacity * 0.66,
        presence: 0.42,
        corridor: 0.62,
        flow: 0.26,
        glow: 0.86,
        boundary: 0,
      };
    case "resolution":
    default:
      return {
        ...b,
        camZ: b.camZ + 9.5,
        camY: b.camY + 1.9,
        spin: b.spin - 0.34,
        presence: 0.74,
        corridor: 0.44,
        flow: 0.84,
        glow: 1.12,
        boundary: 0,
      };
  }
}

/** The state every formation's system act shares: bright, dense, gated. */
function systemCommon(b: Key, gate: number) {
  return {
    presence: 0.92,
    corridor: 0.56,
    flow: 1,
    glow: 1.28,
    boundary: gate,
    nodeScale: b.nodeScale * 1.06,
    edgeOpacity: b.edgeOpacity * 1.15,
  };
}

function systemTravel(b: Key, formation: FormationName, gate: number): [Key, Key] {
  const on = systemCommon(b, gate);
  switch (formation) {
    /**
     * A tracking shot down the chain. The look target travels with the
     * camera — pinned at the origin it would orbit the pipeline
     * instead of going along it, which is the difference between
     * looking at a system and being inside one.
     */
    case "pipeline":
      return [
        { ...b, ...on, camX: -7, lookX: -6.6, camZ: b.camZ - 4.5, spin: b.spin + 0.1 },
        { ...b, ...on, camX: 7, lookX: 6.6, camZ: b.camZ - 5.6, spin: b.spin + 0.3 },
      ];

    /** Down through the tiers, which is what resolving a call across a
     *  language boundary looks like from the side. */
    case "crossstack":
      return [
        {
          ...b,
          ...on,
          camY: b.camY + 2.9,
          lookY: b.lookY + 1.7,
          camZ: b.camZ - 3.4,
          spin: b.spin + 0.16,
        },
        {
          ...b,
          ...on,
          camY: b.camY - 2.7,
          lookY: b.lookY - 1.7,
          camZ: b.camZ - 5.2,
          spin: b.spin + 0.86,
        },
      ];

    /** An overflight, dropping through the sheets rather than round
     *  them. The geospatial one, and deliberately not a globe. */
    case "stack":
      // Steep enough at the start that the sheets read as TILES rather
      // than as horizontal lines. Edge-on, a layer stack and a terrain
      // look identical, and this is the geospatial one.
      return [
        { ...b, ...on, camY: b.camY + 4.2, camZ: b.camZ + 0.6, lookY: b.lookY - 0.7, spin: b.spin + 0.04 },
        { ...b, ...on, camY: b.camY - 1.6, camZ: b.camZ - 4.2, lookY: b.lookY + 1.1, spin: b.spin + 0.56 },
      ];

    /** Most of a revolution around a core that stays put. */
    case "orbit":
      return [
        { ...b, ...on, camZ: b.camZ - 0.5, spin: b.spin },
        { ...b, ...on, camZ: b.camZ - 4.4, spin: b.spin + 2.05 },
      ];

    /** Straight in, along the rows. A record you read from the front. */
    case "ledger":
      return [
        { ...b, ...on, camZ: b.camZ + 1.4, camY: b.camY + 0.5, spin: b.spin - 0.06 },
        { ...b, ...on, camZ: b.camZ - 5.6, camY: b.camY - 1.5, spin: b.spin + 0.34 },
      ];

    /** Turn and close in. No centre to travel towards, so the motion
     *  is the turn itself. */
    case "mesh":
    default:
      return [
        { ...b, ...on, camZ: b.camZ + 1.6, spin: b.spin - 0.22 },
        { ...b, ...on, camZ: b.camZ - 3.6, spin: b.spin + 1.2 },
      ];
  }
}

export function buildActTimeline(
  state: LatticeState,
  scene: Scene,
  plan: ActPlan,
): Timeline {
  const b = baseKey(scene);
  const gate = scene.signature.stages.some((s) => s.boundary) ? 1 : 0;
  const formation = scene.signature.formation;
  const acts = plan.acts;

  const waypoints: Waypoint[] = [];
  for (let i = 0; i < acts.length; i++) {
    const a = acts[i];
    if (!a) continue;
    const span = a.to - a.from;
    if (a.id === "system") {
      const [inKey, outKey] = systemTravel(b, formation, gate);
      waypoints.push({ at: a.from + span * 0.14, key: inKey });
      waypoints.push({ at: a.to - span * 0.04, key: outKey });
      continue;
    }
    const at = i === 0 ? 0 : i === acts.length - 1 ? 1 : (a.from + a.to) / 2;
    waypoints.push({ at, key: actKey(a.id, b, gate) });
  }

  const tl = createTimeline({ autoplay: false, defaults: { ease: EASE.swap } });

  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    if (!from || !to) continue;
    const duration = Math.max(1, (to.at - from.at) * SCRUB);
    tl.add(
      state,
      {
        camX: [from.key.camX, to.key.camX],
        camY: [from.key.camY, to.key.camY],
        camZ: [from.key.camZ, to.key.camZ],
        lookX: [from.key.lookX, to.key.lookX],
        lookY: [from.key.lookY, to.key.lookY],
        spin: [from.key.spin, to.key.spin],
        nodeScale: [from.key.nodeScale, to.key.nodeScale],
        edgeOpacity: [from.key.edgeOpacity, to.key.edgeOpacity],
        presence: [from.key.presence, to.key.presence],
        corridor: [from.key.corridor, to.key.corridor],
        flow: [from.key.flow, to.key.flow],
        glow: [from.key.glow, to.key.glow],
        boundary: [from.key.boundary, to.key.boundary],
        // The rig's own travel channels are zeroed for the whole
        // timeline: the renderer multiplies them by chapter progress,
        // and a driven scene already spends that number here.
        dolly: 0,
        swing: 0,
        duration,
      },
      from.at * SCRUB,
    );
  }

  tl.pause();
  return tl;
}

/**
 * Which band of the lattice a sub-step lights.
 *
 * The formation's group count and the scene's stage count are not the
 * same number — a pipeline has twelve of each because PratiBimb has
 * twelve stages, but a mesh has five groups and EcoShare has five
 * stages plus four layers. Mapping proportionally means the highlight
 * always walks the whole object exactly once, whatever the counts.
 */
export function stepToGroup(step: number, steps: number, formation: FormationName): number {
  const groups = GROUPS[formation];
  if (steps <= 1) return 0;
  return Math.min(groups - 1, Math.floor((step / steps) * groups));
}

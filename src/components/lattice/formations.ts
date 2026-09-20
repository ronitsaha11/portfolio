import type { Formation } from "@/data/types";

/**
 * THE LATTICE — formation geometry.
 *
 * Every system on this site is a graph: nodes joined by edges that
 * carry evidence. That is Cartograph's thesis literally, PratiBimb's
 * twelve-stage pipeline literally, TerraMind's layer stack literally,
 * and it is this site's own data model — a reading joined to the sample
 * that produced it. So the object behind the page is that graph, and
 * scrolling reorganises it into whichever shape the current chapter is
 * about.
 *
 * WHY THE NODES KEEP THEIR IDENTITY
 *
 * Node `i` is the same node in every formation. It does not fade out in
 * one arrangement and fade in somewhere else — it travels. That is the
 * difference between a reorganisation, which reads as the same system
 * seen another way, and a crossfade, which reads as two unrelated
 * decorations. It costs nothing and it is the whole point.
 *
 * WHY THERE IS ONE EDGE LIST
 *
 * Node index is the system's own ordering in every formation, so one
 * edge list — each node joined to its successor and to two braiding
 * strides — is meaningful in all of them at once: the chain along a
 * pipeline, the weave across a sheet, the run of a ledger row, the arc
 * around an orbit. No per-formation edge bookkeeping exists, and none
 * is needed.
 *
 * WHY EACH SHAPE IS BUILT RATHER THAN SCATTERED
 *
 * Every formation below is a recognisable object, not jittered noise
 * with a different radius. A pipeline is a chain of stations you can
 * count; a stack is a set of tiled sheets you can see through; an orbit
 * has a core and inclined rings. A reader who cannot name the shape is
 * looking at wallpaper, and wallpaper is what this replaced.
 */

export type FormationName = Formation | "field" | "constellation" | "converge";

/** Deterministic, so every reload and every machine draws the same lattice. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export interface NodePlan {
  /** Which group this node belongs to, per formation. */
  group: number;
  /** Stable per-node jitter, so formations are varied but reproducible. */
  jx: number;
  jy: number;
  jz: number;
  /** Phase offset for idle drift and for the pulse. */
  phase: number;
  /** 0..1. Decides accent membership and halo weight. */
  rank: number;
}

/** How many groups each formation arranges its nodes into. */
export const GROUPS: Record<FormationName, number> = {
  field: 6,
  stack: 6,
  pipeline: 12,
  crossstack: 7,
  orbit: 5,
  ledger: 5,
  mesh: 5,
  constellation: 6,
  converge: 1,
};

/** Which group node `i` falls in, under `formation`. */
export function groupOf(i: number, total: number, formation: FormationName): number {
  const groups = GROUPS[formation];
  const t = total > 1 ? i / (total - 1) : 0;
  return Math.min(Math.floor(t * groups), groups - 1);
}

export function planNodes(count: number, groups = 6): NodePlan[] {
  const rand = rng(0x9e3779b9);
  return Array.from({ length: count }, (_, i) => ({
    group: Math.min(Math.floor((i / count) * groups), groups - 1),
    jx: rand() * 2 - 1,
    jy: rand() * 2 - 1,
    jz: rand() * 2 - 1,
    phase: rand() * Math.PI * 2,
    rank: rand(),
  }));
}

/**
 * THE EDGE LIST IS THE SUCCESSOR RELATION.
 *
 * Node `i` is joined to `i+1`, and to two longer strides that braid the
 * strands together. Nothing else. That is not a simplification of a
 * graph — it *is* the graph, because the node index is the system's own
 * ordering in every formation: stage after stage in a pipeline, tile
 * after tile across a sheet, row after row in a ledger, point after
 * point around a ring. An edge therefore crosses a group boundary in
 * exactly the places the ordering does, and nowhere else.
 *
 * WHAT THIS REPLACED, AND WHY
 *
 * The first version joined each node to a *random* node in the next
 * group. Correct as a graph, useless as a picture: across a formation
 * sixteen world units wide, random pairing draws a ball of wool, and
 * the fragment shader then throws most of it away for being too long to
 * read. Successor edges are short in every formation by construction,
 * so nothing has to be discarded and the structure is legible.
 *
 * Roughly 1.5 edges per node — enough to read as a built object,
 * sparse enough that the line buffer stays small.
 */
export function planEdges(plans: NodePlan[]): [number, number][] {
  const total = plans.length;
  const edges: [number, number][] = [];

  for (let i = 0; i < total; i++) {
    if (i + 1 < total) edges.push([i, i + 1]);
    // Two strides chosen to be a row apart in the gridded formations and
    // a chord across the ring in the circular ones. Deterministic, so
    // the same lattice is drawn on every machine and every reload.
    if (i % 3 === 0 && i + 6 < total) edges.push([i, i + 6]);
    if (i % 5 === 0 && i + 7 < total) edges.push([i, i + 7]);
  }
  return edges;
}

/** A position written in place — no allocation inside the frame loop. */
export interface Vec3Out {
  x: number;
  y: number;
  z: number;
}

const TAU = Math.PI * 2;

/**
 * Where node `i` sits in `formation`.
 *
 * Written into `out` rather than returned, because this runs
 * `nodes × 2` times per frame and a returned object would be several
 * hundred allocations a frame for no reason at all.
 */
export function place(
  formation: FormationName,
  plan: NodePlan,
  i: number,
  total: number,
  out: Vec3Out,
): void {
  const groups = GROUPS[formation];
  const t = total > 1 ? i / (total - 1) : 0;
  const g = Math.min(Math.floor(t * groups), groups - 1);
  /** Size of one group, and this node's index inside its own group. */
  const per = Math.max(1, Math.ceil(total / groups));
  const k = i % per;
  /** Position within this node's own group, -1..1. */
  const within = per > 1 ? (k / (per - 1)) * 2 - 1 : 0;

  switch (formation) {
    /**
     * THE LATTICE ITSELF — a jittered crystal.
     *
     * The hero is the one chapter that is not about a particular
     * system, so the shape is the thing the whole page is named after:
     * a regular structure with enough disorder to be physical. Slabs
     * in depth, struts between them, and it is deliberately biased
     * away from the camera so the reader is looking *at* an object
     * rather than standing inside a cloud of dots. A starfield was
     * what the first attempt produced, and a starfield says nothing.
     */
    case "field": {
      const cols = 8;
      const rows = Math.max(1, Math.ceil(per / cols));
      const cx = (k % cols) / (cols - 1) - 0.5;
      const cy = Math.floor(k / cols) / Math.max(1, rows - 1) - 0.5;
      const slab = g / Math.max(1, groups - 1);
      out.x = cx * 17 + plan.jx * 0.38;
      out.y = cy * 11.5 + plan.jy * 0.38;
      out.z = (slab - 0.86) * 19 + plan.jz * 0.5;
      return;
    }

    /**
     * SHEETS — layers as tiled surfaces rather than as lines.
     *
     * This is TerraMind's formation, and the shape has to carry two
     * readings at once: a layered backend, which is what the stages
     * list says, and a tiled analysis surface, which is what the system
     * actually operates on. A grid of tiles per layer is both, and it
     * is why the camera for that chapter sits high and looks down.
     */
    case "stack": {
      const cols = 6;
      const rows = Math.max(1, Math.ceil(per / cols));
      const cx = (k % cols) / (cols - 1 || 1) - 0.5;
      const cz = Math.floor(k / cols) / (rows - 1 || 1) - 0.5;
      const level = (g - (groups - 1) / 2) * -1.55;
      // Each sheet is turned slightly against the one above it, so the
      // stack reads as separate surfaces rather than as one solid.
      const a = g * 0.14;
      const sx = cx * 11.4 + plan.jx * 0.18;
      const sz = cz * 7.2 + plan.jz * 0.18;
      out.x = sx * Math.cos(a) - sz * Math.sin(a);
      out.y = level + plan.jy * 0.08;
      out.z = sx * Math.sin(a) + sz * Math.cos(a);
      return;
    }

    /**
     * PIPELINE — an ordered chain of stations with a gate partway
     * along it. PratiBimb's twelve stages, and the count is literal.
     * Each station is a small ring so the stages can be counted.
     */
    case "pipeline": {
      const along = (g / (groups - 1)) * 2 - 1;
      const ring = (k / per) * TAU + plan.phase * 0.2;
      const radius = 1.05 + plan.rank * 0.5;
      out.x = along * 9.6;
      out.y = Math.cos(ring) * radius + Math.sin(g * 0.8) * 0.28;
      out.z = Math.sin(ring) * radius;
      return;
    }

    /**
     * CROSS-STACK — tiers joined across a language boundary. Cartograph
     * resolves a call in TypeScript to a row in Postgres, and the whole
     * point of the picture is that the tiers are separate planes with
     * edges crossing between them.
     */
    case "crossstack": {
      const tier = (g - (groups - 1) / 2) * -1.6;
      const spread = g === 0 || g === groups - 1 ? 5.2 : 3.6;
      out.x = within * spread + plan.jx * 0.35;
      out.y = tier + plan.jy * 0.1;
      out.z = (plan.jz * 0.5 + Math.sin(k * 1.7) * 0.5) * 2.4;
      return;
    }

    /**
     * ORBIT — a core with inclined rings around it. An orchestrator and
     * the agents it dispatches: the centre is one thing, and everything
     * else is held in relation to it.
     */
    case "orbit": {
      if (g === 0) {
        out.x = plan.jx * 0.9;
        out.y = plan.jy * 0.9;
        out.z = plan.jz * 0.9;
        return;
      }
      const radius = 2.6 + g * 1.7;
      const a = (k / per) * TAU + plan.phase * 0.15;
      const tilt = 0.28 + g * 0.34;
      const ex = Math.cos(a) * radius;
      const ey = Math.sin(a) * radius;
      out.x = ex;
      out.y = ey * Math.sin(tilt) + plan.jy * 0.18;
      out.z = ey * Math.cos(tilt);
      return;
    }

    /**
     * LEDGER — durable rows receding into depth. Records that survive a
     * restart, and a timeline you read from the front.
     */
    case "ledger": {
      const cols = 12;
      const col = k % cols;
      const row = Math.floor(k / cols);
      const rowsPer = Math.max(1, Math.ceil(per / cols));
      out.x = (col / (cols - 1) - 0.5) * 13.6;
      out.y = (g - (groups - 1) / 2) * -1.15 + plan.jy * 0.06;
      out.z = (row / (rowsPer - 1 || 1) - 0.5) * 5.4;
      return;
    }

    /**
     * MESH — peers coordinating with no centre. One ring, with the
     * ranks pushed out to different radii so it reads as a population
     * rather than as a wheel.
     */
    case "mesh": {
      const a = (i / total) * TAU * 2.0 + plan.phase * 0.4;
      const r = 4.2 + plan.rank * 4.4;
      out.x = Math.cos(a) * r * 1.22;
      out.y = Math.sin(a) * r * 0.58;
      out.z = plan.jz * 2.6;
      return;
    }

    /**
     * CONSTELLATION — one cluster per system, the index of the work.
     * Six clusters, six systems, and the count is not a coincidence.
     */
    case "constellation": {
      const cx = (g - (groups - 1) / 2) * 3.9;
      const cy = (g % 2 === 0 ? 1 : -1) * 1.5;
      const a = (k / per) * TAU + plan.phase;
      const r = 0.5 + plan.rank * 1.25;
      out.x = cx + Math.cos(a) * r * 1.2;
      out.y = cy + Math.sin(a) * r;
      out.z = plan.jz * 1.9;
      return;
    }

    /**
     * CONVERGE — everything pulled into one slow helix. The end of the
     * page, and the only formation with a single group.
     */
    case "converge": {
      const a = t * TAU * 3 + plan.phase * 0.3;
      const r = 1.1 + (1 - t) * 2.6;
      out.x = Math.cos(a) * r * 1.6;
      out.y = (t - 0.5) * 6.2;
      out.z = Math.sin(a) * r * 1.6;
      return;
    }
  }
}

/**
 * Where the boundary plane sits in a formation, in the formation's own
 * coordinates, given which group the boundary stage belongs to.
 * Returns null where the formation has no meaningful boundary.
 */
export function boundaryPlane(
  formation: FormationName,
  groupIndex: number,
): { axis: "x" | "y"; at: number } | null {
  const groups = GROUPS[formation];
  switch (formation) {
    case "pipeline":
      return { axis: "x", at: ((groupIndex + 0.5) / (groups - 1)) * 2 * 9.6 - 9.6 };
    case "crossstack":
      return { axis: "y", at: (groupIndex + 0.5 - (groups - 1) / 2) * -1.6 };
    case "stack":
      return { axis: "y", at: (groupIndex + 0.5 - (groups - 1) / 2) * -1.55 };
    case "ledger":
      return { axis: "y", at: (groupIndex + 0.5 - (groups - 1) / 2) * -1.15 };
    case "orbit":
      return { axis: "y", at: 0 };
    default:
      return null;
  }
}

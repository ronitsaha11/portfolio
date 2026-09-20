import type { FormationName } from "./formations";

/**
 * THE INTERCHANGE — layer 3 of the animation system.
 *
 * One plain mutable object. anime.js timelines write to it, the input
 * listeners write to it, and the render loop reads it. That is the
 * entire contract between the page and the WebGL scene, and keeping it
 * to numbers is what stops the two becoming entangled.
 *
 * It is deliberately NOT React state. A scroll-linked or pointer-linked
 * value in state re-renders the tree on every frame, which is the single
 * most reliable way to make an R3F scene stutter — and it would
 * re-render the whole page, not just the canvas.
 *
 * THREE KINDS OF FIELD, AND THE DIFFERENCE MATTERS
 *
 *   AUTHORED   a chapter pose. Written by anime.js tweens, on the
 *              director schedule.
 *   DRIVEN     scroll and pointer. Written by listeners, at input rate.
 *   DAMPED     the smoothed value the renderer actually uses. Written
 *              only by the frame loop, which is the only code that
 *              knows how long the frame was.
 *
 * Nothing holds a three.js object; the scene owns those.
 */
export interface LatticeState {
  /* ---- AUTHORED: the formation ---- */

  /** The formation being left, and the one being entered. */
  from: FormationName;
  to: FormationName;
  /** 0 = fully `from`, 1 = fully `to`. The only thing MORPH animates. */
  blend: number;

  /* ---- AUTHORED: the camera rig ---- */

  camX: number;
  camY: number;
  camZ: number;
  /**
   * Where the camera looks.
   *
   * `lookX` is what turns a sideways dolly into a tracking shot. With
   * the target pinned at the origin, moving the camera along x orbits
   * the formation; moving the target with it travels *along* the
   * chain, which is the difference between looking at a pipeline and
   * going down one.
   */
  lookX: number;
  lookY: number;
  /** Yaw applied to the whole lattice, so chapters can turn it. */
  spin: number;
  /**
   * How far the camera travels *through* the chapter, in world units on
   * z. This is the field the reader drives: the director links it to
   * scroll progress so the viewpoint is always moving while they are.
   */
  dolly: number;
  /** Yaw travelled across the chapter, same idea. */
  swing: number;

  /* ---- AUTHORED: appearance ---- */

  nodeScale: number;
  nodeOpacity: number;
  edgeOpacity: number;
  /** The gate plane: 0 hidden, 1 fully drawn. */
  boundary: number;
  /** Which group the boundary sits after, in the current formation. */
  boundaryGroup: number;
  /** Global fade, used to hand the page back where prose needs the room. */
  presence: number;
  /**
   * How hard the lattice gets out of the way of the reading column,
   * 0..1. Applied in screen space in the shaders, so the scene visibly
   * thins where the text is rather than being dimmed everywhere.
   */
  corridor: number;
  /**
   * Where the reading column is, in normalised device coordinates.
   * Measured from the DOM on resize, not guessed from the aspect
   * ratio: the column is left-biased on wide screens because of the
   * chapter rail, and it fills the frame on a phone.
   */
  corridorCentre: number;
  corridorHalf: number;
  /** Signal density for this chapter, 0..1. */
  flow: number;
  /** Emissive multiplier. The one thing bloom keys off. */
  glow: number;

  /* ---- DRIVEN: the reader ---- */

  pointerXTarget: number;
  pointerYTarget: number;
  /** Peak pointer speed since the frame loop last consumed it, 0..1. */
  pointerSpeed: number;
  /** Peak scroll speed since the frame loop last consumed it, 0..1. */
  scrollSpeed: number;
  /** A click or tap. Decays over one beat. */
  tapPulse: number;
  /** 0..1 down the whole document. */
  pageProgress: number;
  /** 0..1 through the chapter that currently owns the scene. */
  chapterProgress: number;
  /** 1 once the reader has stopped doing anything. */
  idleTarget: number;
  lastInput: number;

  /* ---- DAMPED: what the renderer reads ---- */

  pointerX: number;
  pointerY: number;
  /** Smoothed union of pointer and scroll speed. Drives brightness. */
  energy: number;
  idle: number;

  /* ---- interaction ---- */

  /**
   * Highlighted group, or -1. Hovering a stage in the semantic list
   * lights the matching nodes, which is what ties the accessible
   * reading of a scene to the picture of it.
   */
  focusGroup: number;

  /**
   * Which component currently owns the corridor measurement, or null
   * for the page default.
   *
   * A pinned case study reads against a narrower, hard-left column
   * than the editorial sections, so while one is on screen it writes
   * the corridor itself. Ownership is a field rather than a race
   * between two writers on the same two numbers.
   */
  corridorOwner: string | null;

  /** Set false to let the loop skip work entirely. */
  active: boolean;
}

export function createLatticeState(): LatticeState {
  return {
    from: "field",
    to: "field",
    blend: 1,

    camX: 0,
    camY: 0,
    camZ: 17,
    lookX: 0,
    lookY: 0,
    spin: 0,
    dolly: 0,
    swing: 0,

    nodeScale: 1,
    nodeOpacity: 0.9,
    edgeOpacity: 0.34,
    boundary: 0,
    boundaryGroup: 0,
    presence: 1,
    corridor: 0.5,
    corridorCentre: 0,
    corridorHalf: 0.6,
    flow: 0.5,
    glow: 1,

    pointerXTarget: 0,
    pointerYTarget: 0,
    pointerSpeed: 0,
    scrollSpeed: 0,
    tapPulse: 0,
    pageProgress: 0,
    chapterProgress: 0,
    idleTarget: 0,
    lastInput: 0,

    pointerX: 0,
    pointerY: 0,
    energy: 0,
    idle: 0,

    focusGroup: -1,
    corridorOwner: null,
    active: true,
  };
}

/**
 * What a chapter asks the lattice to look like.
 *
 * A chapter declares a target; the director animates the state towards
 * it. Chapters never touch the state directly, so two chapters cannot
 * fight over the same field.
 */
export interface LatticePose {
  formation: FormationName;
  /**
   * The chapter drives the camera itself, frame by frame, from its own
   * scroll progress.
   *
   * The director still performs the formation morph — that is a cut and
   * belongs to whoever notices the chapter boundary — but it leaves the
   * camera and the appearance channels alone, so a pinned case study's
   * act timeline is the only writer, and the two cannot fight over camZ
   * for the eleven hundred milliseconds after a boundary.
   */
  driven?: boolean;
  camX?: number;
  camY?: number;
  camZ?: number;
  lookX?: number;
  lookY?: number;
  spin?: number;
  /** Camera travel through the chapter, driven by scroll progress. */
  dolly?: number;
  swing?: number;
  nodeScale?: number;
  nodeOpacity?: number;
  edgeOpacity?: number;
  boundary?: number;
  boundaryGroup?: number;
  presence?: number;
  corridor?: number;
  flow?: number;
  glow?: number;
}

/**
 * The pose each chapter holds.
 *
 * READ THIS AS A SHOT LIST. Wide and slow at the top, tight and busy at
 * the index, low and oblique under the prose chapters, and a hard pull
 * to a single point at the end. The variation is the point: a page
 * where every chapter is seen from the same distance has a background,
 * not a scene. Case studies override all of this from their own
 * signature.
 */
export const POSES: Record<string, LatticePose> = {
  top: {
    formation: "field",
    camZ: 20,
    camY: 0.4,
    spin: 0,
    // Every chapter travels. The reader is always moving the camera by
    // moving down the page, which is what makes scrolling feel like it
    // has a consequence rather than like it reveals paragraphs.
    dolly: 5.5,
    swing: 0.34,
    nodeScale: 1.1,
    edgeOpacity: 0.26,
    presence: 0.82,
    corridor: 0.44,
    flow: 0.55,
    glow: 1.15,
  },
  position: {
    formation: "field",
    camZ: 15,
    camY: -0.6,
    spin: 0.5,
    dolly: 3,
    swing: 0.22,
    nodeScale: 0.9,
    edgeOpacity: 0.26,
    presence: 0.6,
    corridor: 0.5,
    flow: 0.4,
    glow: 0.9,
  },
  systems: {
    formation: "constellation",
    camZ: 18,
    camY: 0,
    spin: -0.1,
    dolly: 4.2,
    swing: 0.3,
    nodeScale: 0.82,
    edgeOpacity: 0.3,
    presence: 0.46,
    corridor: 0.58,
    flow: 0.6,
    glow: 0.95,
  },
  method: {
    formation: "ledger",
    camZ: 16,
    camY: 1.4,
    lookY: 0.3,
    spin: -0.25,
    dolly: 3.6,
    swing: 0.16,
    nodeScale: 0.72,
    edgeOpacity: 0.2,
    presence: 0.5,
    corridor: 0.5,
    flow: 0.5,
    glow: 0.85,
  },
  source: {
    formation: "stack",
    camZ: 14,
    camY: 2.6,
    lookY: -0.4,
    spin: 0.6,
    dolly: 3,
    swing: 0.2,
    nodeScale: 0.7,
    edgeOpacity: 0.18,
    presence: 0.42,
    corridor: 0.5,
    flow: 0.35,
    glow: 0.8,
  },
  instruments: {
    formation: "mesh",
    camZ: 16.5,
    camY: 0,
    spin: 0.3,
    dolly: 3.2,
    swing: 0.34,
    nodeScale: 0.76,
    edgeOpacity: 0.24,
    presence: 0.48,
    corridor: 0.5,
    flow: 0.6,
    glow: 0.9,
  },
  traverse: {
    formation: "ledger",
    camZ: 17,
    camY: 0.2,
    spin: 0.15,
    dolly: 4,
    swing: 0.12,
    nodeScale: 0.7,
    edgeOpacity: 0.2,
    presence: 0.46,
    corridor: 0.5,
    flow: 0.7,
    glow: 0.85,
  },
  contact: {
    formation: "converge",
    camZ: 12,
    camY: 0,
    spin: 0,
    dolly: 4.5,
    swing: 0.5,
    nodeScale: 1.05,
    edgeOpacity: 0.44,
    presence: 0.78,
    corridor: 0.5,
    flow: 1,
    glow: 1.45,
  },
};

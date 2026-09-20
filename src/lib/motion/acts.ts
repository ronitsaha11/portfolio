import type { Scene } from "@/data/types";

/**
 * THE PROJECT STATE MACHINE.
 *
 * A case study is not a section you scroll past; it is a sequence of
 * acts you scroll *through*, and the same number — the section's
 * progress through its own pinned range — drives the DOM, the camera,
 * the formation and the lighting. This module turns a scene into that
 * sequence, and it is the only place the sequence is written down.
 *
 * IT IS DERIVED, NOT AUTHORED PER PROJECT.
 *
 * There is no `if (slug === "pratibimb")` anywhere in the system. The
 * acts come from what the scene actually has: twelve pipeline stages
 * make PratiBimb's system act long and make the gate arrive two thirds
 * of the way through it; Cartograph's nine stages cross a language
 * boundary, so its system act descends the tiers instead of travelling
 * along a chain; EcoShare has five stages and four layers and a
 * different act set entirely. Six projects, six shapes of narrative,
 * one machine — and adding a seventh project needs no code.
 *
 * WHY FLAGSHIPS AND SUPPORTING SCENES GET DIFFERENT ACT SETS
 *
 * Giving every project the same seven beats would make the sixth one
 * feel like the first one again. A supporting scene folds architecture
 * into the system walk and the readings into the resolution, so it
 * reads as a shorter form rather than as a flagship with less in it.
 *
 * THE BEAT IS THE UNIT OF SCROLL.
 *
 * One beat is one thing the reader should look at. An act's weight is
 * how many beats it is worth, and the track's height is the total
 * multiplied by `--act-beat` in CSS — so the physical length of a case
 * study is proportional to how much there is in it, and the number of
 * viewport-heights is never typed by hand.
 */

export type ActId =
  | "intro"
  | "overview"
  | "system"
  | "architecture"
  | "challenge"
  | "evidence"
  | "resolution";

export interface Act {
  id: ActId;
  /** Shown in the act readout at the head of the pinned frame. */
  label: string;
  /** How many discrete things the reader walks through inside this act. */
  steps: number;
  /** Scroll weight, in beats. */
  weight: number;
  /** Start and end of this act within the track, 0..1. */
  from: number;
  to: number;
}

export interface ActCursor {
  index: number;
  act: Act;
  /** Position inside the act, 0..1. */
  local: number;
  /** Which sub-step is current, 0..steps-1. */
  step: number;
  /** Position inside the current sub-step, 0..1. */
  stepLocal: number;
}

export interface ActPlan {
  acts: Act[];
  /** Total beats. The track's height is this times `--act-beat`. */
  beats: number;
  /** Index of the `system` act, or -1. */
  systemIndex: number;
}

/**
 * A beat is deliberately not one viewport.
 *
 * At a full viewport per beat a twelve-stage pipeline would need
 * twelve screens of scrolling to walk once, which is the failure mode
 * the brief calls scrolling endlessly through repeated animations. A
 * third of a viewport is enough travel for a reveal to complete and
 * settle at reading speed, and it puts a flagship case study at about
 * seven screens end to end.
 */
const LABELS: Record<ActId, string> = {
  intro: "Intro",
  overview: "Overview",
  system: "The system",
  architecture: "Architecture",
  challenge: "The hard part",
  evidence: "Evidence",
  resolution: "Resolution",
};

function act(id: ActId, steps: number, weight: number): Act {
  return { id, label: LABELS[id], steps: Math.max(1, steps), weight, from: 0, to: 1 };
}

export function planActs(scene: Scene): ActPlan {
  const stages = scene.signature.stages.length;
  const layers = scene.layers.length;
  const readings = scene.readings.length;
  const flagship = scene.tier === "flagship";

  const acts: Act[] = flagship
    ? [
        act("intro", 1, 1.5),
        act("overview", 3, 2.2),
        // The long one. Every stage gets its own beat, because the
        // stage list is the semantic reading of the 3D and walking it
        // is what makes the formation legible rather than decorative.
        act("system", stages, 1 + stages * 0.55),
        act("architecture", layers, 0.8 + layers * 0.5),
        act("challenge", 1, 1.6),
        act("evidence", readings, 1 + readings * 0.4),
        act("resolution", 1, 1.6),
      ]
    : [
        act("intro", 1, 1.4),
        act("overview", 2, 1.8),
        // Supporting scenes walk the stages and then the layers in one
        // continuous descent, rather than stopping and restarting.
        act("system", stages + layers, 1 + (stages + layers) * 0.5),
        act("challenge", 1, 1.5),
        act("resolution", 1, 1.8),
      ];

  const beats = acts.reduce((sum, a) => sum + a.weight, 0);
  let at = 0;
  for (const a of acts) {
    a.from = at / beats;
    at += a.weight;
    a.to = at / beats;
  }

  return { acts, beats, systemIndex: acts.findIndex((a) => a.id === "system") };
}

/** Signed position of `p` inside an act. Negative before, >1 after. */
export function actLocal(p: number, a: Act): number {
  const span = a.to - a.from;
  return span > 0 ? (p - a.from) / span : 0;
}

/**
 * Where the reader is.
 *
 * Sub-steps are laid out with a short settle at the end of each, so a
 * stage is fully lit for a moment before the next one takes over
 * rather than the highlight sliding continuously — a discrete thing
 * being read continuously is what makes a stepper feel unresolved.
 */
export function resolveAct(plan: ActPlan, p: number): ActCursor {
  const acts = plan.acts;
  let index = 0;
  for (let i = 0; i < acts.length; i++) {
    const a = acts[i];
    if (!a) continue;
    if (p >= a.from) index = i;
  }
  const current = acts[index] ?? acts[0]!;
  const local = Math.min(1, Math.max(0, actLocal(p, current)));
  const raw = local * current.steps;
  const step = Math.min(current.steps - 1, Math.floor(raw));
  return { index, act: current, local, step, stepLocal: Math.min(1, raw - step) };
}

/**
 * QUALITY TIERS.
 *
 * One question — how much can this machine afford — asked once, answered
 * with a named tier, and every cost in the 3D system is a field on that
 * tier's profile. Nothing else in the codebase is allowed to branch on
 * `isMobile` or on a core count: it reads a profile field.
 *
 * THE RULE THIS EXISTS TO ENFORCE
 *
 * A desktop with a discrete GPU should not be given a phone's scene
 * because a phone exists. Equally, a phone should not be given nothing
 * at all — the page has to feel alive on a phone too, so LOW is a real
 * scene with fewer of everything rather than a switch that turns the
 * canvas off. OFF is reserved for two honest reasons: the reader asked
 * for reduced motion, or the browser cannot give us a context.
 *
 * WHY THE HINTS ARE TREATED AS WEAK EVIDENCE
 *
 * `deviceMemory` is quantised and capped at 8 by every browser that
 * reports it, `hardwareConcurrency` counts threads on a machine that may
 * be doing something else entirely, and neither says anything about the
 * GPU. They are used only to step *down* from the tier the viewport
 * implies, never to step up, and the runtime frame monitor in
 * `useAdaptiveQuality` is what actually has the last word.
 */

export type QualityTier = "high" | "balanced" | "low" | "off";

export interface QualityProfile {
  tier: QualityTier;
  /** Lattice node count. */
  nodes: number;
  /** Travelling signal particles. */
  signals: number;
  /** Upper bound on devicePixelRatio. */
  dpr: number;
  /** Selective bloom. The only full-screen pass on the site. */
  bloom: boolean;
  /** The procedural backdrop. */
  atmosphere: boolean;
  /** Per-node glow halo radius, in node radii. 0 disables the halo. */
  halo: number;
  /** Multiplier on pointer-driven camera parallax. */
  parallax: number;
  /**
   * How much of the chapter's corridor setting to apply.
   *
   * A phone's reading column is the whole screen, so a corridor tuned
   * for a desktop margin dims the entire scene there and the page goes
   * flat — which is the failure this whole pass exists to undo. The
   * low tier already draws fewer and smaller nodes, so it can afford a
   * weaker corridor and still keep its contrast.
   */
  corridorBias: number;
}

export const PROFILES: Record<QualityTier, QualityProfile> = {
  high: {
    tier: "high",
    nodes: 220,
    signals: 180,
    dpr: 2,
    bloom: true,
    atmosphere: true,
    halo: 2.8,
    parallax: 1,
    corridorBias: 1,
  },
  balanced: {
    tier: "balanced",
    nodes: 150,
    signals: 105,
    dpr: 1.5,
    bloom: false,
    atmosphere: true,
    halo: 2.5,
    parallax: 0.7,
    corridorBias: 0.92,
  },
  low: {
    tier: "low",
    nodes: 132,
    signals: 66,
    dpr: 1.35,
    bloom: false,
    atmosphere: false,
    // Slightly larger nodes than the balanced tier, not smaller. The
    // low tier is mostly phones, a phone is held closer than a
    // monitor, and with the camera pulled back for a portrait frame a
    // node drawn at desktop size is a speck.
    halo: 2.7,
    parallax: 0.35,
    corridorBias: 0.62,
  },
  off: {
    tier: "off",
    nodes: 0,
    signals: 0,
    dpr: 1,
    bloom: false,
    atmosphere: false,
    halo: 0,
    parallax: 0,
    corridorBias: 1,
  },
};

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
}

/** One step down the ladder. `off` is never reached by degradation. */
export function stepDown(tier: QualityTier): QualityTier {
  if (tier === "high") return "balanced";
  if (tier === "balanced") return "low";
  return "low";
}

export function stepUp(tier: QualityTier): QualityTier {
  if (tier === "low") return "balanced";
  if (tier === "balanced") return "high";
  return "high";
}

/**
 * The tier this machine starts at.
 *
 * Viewport first, because it is the only signal that is actually about
 * the device rather than about the moment. Then the two platform hints,
 * and only ever downwards.
 */
const TIERS: QualityTier[] = ["high", "balanced", "low", "off"];

/**
 * `?lattice=high|balanced|low|off` pins the tier, and so does a
 * `lattice` key in localStorage.
 *
 * Worth the handful of lines: the difference between the tiers is only
 * visible on hardware that would not otherwise choose them, so without
 * an override there is no way to look at the low tier on a desktop or
 * to confirm the high tier on a machine the heuristics mistrust. It
 * also makes a bug report reproducible. The storage key exists because
 * some embedded viewers drop the query string on navigation.
 */
export function pinnedTier(): QualityTier | null {
  try {
    const q = new URLSearchParams(window.location.search).get("lattice");
    const fromQuery = TIERS.find((t) => t === q);
    if (fromQuery) {
      window.localStorage.setItem("lattice", fromQuery);
      return fromQuery;
    }
    // `?lattice=auto` — or anything else that is not a tier — clears the
    // pin. Without a way out, a visitor who once opened a link carrying
    // `?lattice=low` would be held on the low tier for good, which is a
    // debugging affordance turning into a bug.
    if (q !== null) {
      window.localStorage.removeItem("lattice");
      return null;
    }
    const stored = window.localStorage.getItem("lattice");
    return TIERS.find((t) => t === stored) ?? null;
  } catch {
    return null;
  }
}

export function detectTier(): QualityTier {
  if (typeof window === "undefined") return "off";

  const pinned = pinnedTier();
  if (pinned) return pinned;

  const w = window.innerWidth;
  let tier: QualityTier = w < 700 ? "low" : w < 1100 ? "balanced" : "high";

  const nav = navigator as NavigatorWithHints;
  const memory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;

  if (typeof memory === "number" && memory <= 4) tier = stepDown(tier);
  if (typeof cores === "number" && cores <= 4) tier = stepDown(tier);

  // A very high pixel ratio on a small viewport is a phone pushing a lot
  // of fragments for its size; the fill cost is the thing that bites.
  if (window.devicePixelRatio >= 3 && w < 900) tier = stepDown(tier);

  return tier;
}

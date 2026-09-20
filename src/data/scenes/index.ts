import { pratibimb } from "./pratibimb";
import { cartograph } from "./cartograph";
import { terramind } from "./terramind";
import { stealthFriday } from "./stealthFriday";
import { healthtrack } from "./healthtrack";
import { ecoshare } from "./ecoshare";
import type { Scene } from "../types";

/**
 * Ordered as the survey runs. Scene number is authoritative, and the
 * sort keeps it that way if a file is added out of order.
 *
 * The order is a real hierarchy, not a ranking: the three flagships are
 * the systems with an architecture worth several screens, and the three
 * supporting scenes are real work that does not need that much room.
 * Nothing here is labelled "best".
 */
export const scenes: Scene[] = [
  pratibimb,
  cartograph,
  terramind,
  stealthFriday,
  healthtrack,
  ecoshare,
].sort((a, b) => a.sceneNumber - b.sceneNumber);

export const flagshipScenes: Scene[] = scenes.filter((s) => s.tier === "flagship");
export const supportingScenes: Scene[] = scenes.filter((s) => s.tier === "supporting");

export const sceneBySlug = (slug: string): Scene | undefined =>
  scenes.find((s) => s.slug === slug);

export { pratibimb, cartograph, terramind, stealthFriday, healthtrack, ecoshare };
export { terramindSource } from "./terramind";

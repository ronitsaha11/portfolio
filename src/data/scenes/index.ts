import { terramind } from "./terramind";
import { healthtrack } from "./healthtrack";
import { stealthFriday } from "./stealthFriday";
import { ecoshare } from "./ecoshare";
import type { Scene } from "../types";

/** Ordered as the survey runs. Scene number is authoritative. */
export const scenes: Scene[] = [terramind, healthtrack, stealthFriday, ecoshare].sort(
  (a, b) => a.sceneNumber - b.sceneNumber,
);

export const sceneBySlug = (slug: string): Scene | undefined =>
  scenes.find((s) => s.slug === slug);

export { terramind, healthtrack, stealthFriday, ecoshare };
export { terramindSource } from "./terramind";

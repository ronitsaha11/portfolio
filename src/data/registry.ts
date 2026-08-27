import { positionReadings } from "./readings";
import { scenes } from "./scenes";
import { capabilities } from "./capabilities";
import type { Reading } from "./types";

/**
 * Every reading shipped on the site, aggregated — so the counts rendered
 * in the boot sequence, the colophon and the console banner are computed
 * from the data rather than typed by hand and left to drift.
 */
export const allReadings: Reading[] = [
  ...positionReadings,
  ...scenes.flatMap((s) => s.readings),
];

export const registry = {
  scenes: scenes.length,
  readings: allReadings.length,
  samples: allReadings.reduce((n, r) => n + r.samples.length, 0),
  attributed: allReadings.filter((r) => r.confidence === "attributed").length,
  decisions: scenes.reduce((n, s) => n + s.decisions.length, 0),
  capabilities: capabilities.reduce((n, c) => n + c.items.length, 0),
} as const;

import type { Reading } from "./types";

/**
 * The editorial rule of this site, enforced mechanically:
 * a reading without a ground sample does not build.
 *
 * Imported by app/sitemap.ts so it runs on every production build —
 * the same trick as a lint gate, but for honesty rather than style.
 */
export function assertReadings(readings: Reading[], context: string): void {
  const seen = new Set<string>();

  for (const r of readings) {
    if (seen.has(r.id)) {
      throw new Error(
        `[ground-truth] Duplicate reading id "${r.id}" in ${context}. ` +
          `Ids are used as React keys and anchor targets; they must be unique.`,
      );
    }
    seen.add(r.id);

    if (r.samples.length === 0) {
      throw new Error(
        `[ground-truth] Reading "${r.id}" in ${context} has no ground sample. ` +
          `Every number on this site must link to the artifact it was measured from.`,
      );
    }

    for (const s of r.samples) {
      if (!s.href.startsWith("https://")) {
        throw new Error(
          `[ground-truth] Sample "${s.label}" on reading "${r.id}" is not https.`,
        );
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s.measuredAt)) {
        throw new Error(
          `[ground-truth] Sample "${s.label}" on reading "${r.id}" has no ISO measuredAt date.`,
        );
      }
    }
  }
}

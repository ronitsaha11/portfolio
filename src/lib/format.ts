/**
 * Splits a reading value into a countable number plus its fixed
 * surroundings, so "8 / 49" counts the 8 and "562" counts the 562,
 * while "live" and "shared" are returned as null and never animate.
 */
export function splitReadingValue(
  value: string,
): { prefix: string; num: number; suffix: string; decimals: number } | null {
  const match = value.match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  const [, prefix = "", numStr = "", suffix = ""] = match;
  const num = Number(numStr);
  if (!Number.isFinite(num)) return null;

  const dot = numStr.indexOf(".");
  const decimals = dot === -1 ? 0 : numStr.length - dot - 1;

  return { prefix, num, suffix, decimals };
}

export function formatCount(n: number, decimals: number): string {
  return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
}

/** "2026-08-27" → "27 AUG 2026", for sample cards. */
export function formatMeasuredAt(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const mi = Number(m) - 1;
  const name = months[mi] ?? m ?? "";
  return `${d} ${name} ${y}`;
}

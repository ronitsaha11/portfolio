/**
 * Subsolar point for a given instant — solar declination plus the
 * equation of time. The same maths as SunLightingMath.ts in TerraMind.
 *
 * Shared by the hero globe (which draws the terminator from it) and the
 * acquisition sequence (which prints it), so the number on screen during
 * the boot is the number the globe then renders.
 */

const DEG = Math.PI / 180;

export interface SubsolarPoint {
  lat: number;
  lon: number;
}

export function subsolarPoint(now: Date): SubsolarPoint {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = (now.getTime() - start) / 86_400_000;
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;

  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (utcHours - 12) / 24);

  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const lat = decl / DEG;
  const lon = -15 * (utcHours - 12 + eqTime / 60);

  return { lat, lon: ((lon + 540) % 360) - 180 };
}

/** "12.4N 38.2W" — the way a coordinate is written on an instrument. */
export function formatCoord(p: SubsolarPoint): string {
  const ns = p.lat >= 0 ? "N" : "S";
  const ew = p.lon >= 0 ? "E" : "W";
  return `${Math.abs(p.lat).toFixed(1)}${ns} ${Math.abs(p.lon).toFixed(1)}${ew}`;
}

export function toCartesian(latDeg: number, lonDeg: number) {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  return {
    x: Math.cos(lat) * Math.sin(lon),
    y: Math.sin(lat),
    z: Math.cos(lat) * Math.cos(lon),
  };
}

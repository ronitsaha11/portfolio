import { ImageResponse } from "next/og";
import { site } from "@/data/site";
import { registry } from "@/data/registry";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.concept}`;

/* Satori requires an explicit display on every element with more than one
   child, so every div below sets it rather than relying on a default. */
export default function OpengraphImage() {
  const stats: [string, number][] = [
    ["SCENES", registry.scenes],
    ["READINGS", registry.readings],
    ["GROUND SAMPLES", registry.samples],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0E1213",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 44, height: 2, backgroundColor: "#FF6B33" }} />
          <div
            style={{
              display: "flex",
              marginLeft: 16,
              color: "#FF6B33",
              fontSize: 20,
              letterSpacing: 6,
            }}
          >
            GROUND TRUTH
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              color: "#E8EBE8",
              fontSize: 104,
              fontWeight: 800,
              letterSpacing: -3,
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              display: "flex",
              color: "#A3ADAC",
              fontSize: 34,
              marginTop: 18,
              maxWidth: 900,
            }}
          >
            {site.thesis}
          </div>
        </div>

        <div style={{ display: "flex" }}>
          {stats.map(([label, value]) => (
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column", marginRight: 56 }}
            >
              <div style={{ display: "flex", color: "#727C7C", fontSize: 16, letterSpacing: 4 }}>
                {label}
              </div>
              <div style={{ display: "flex", color: "#E8EBE8", fontSize: 40, marginTop: 6 }}>
                {String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

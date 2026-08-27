"use client";

import { Section } from "@/components/layout/Section";
import { StaggerGrid, StaggerCell } from "@/components/primitives/StaggerGrid";
import { Tilt3D } from "@/components/primitives/Tilt3D";
import { Depth3D } from "@/components/primitives/Depth3D";
import { ElevationBar } from "@/components/primitives/ElevationBar";
import { useLenis } from "@/components/providers/LenisProvider";
import { scenes } from "@/data/scenes";

/** Depth of ownership, encoded on the elevation ramp. */
const ownershipDepth = (slug: string): 0 | 1 | 2 | 3 | 4 => {
  switch (slug) {
    case "terramind":
      return 4;
    case "healthtrack":
      return 3;
    case "stealth-friday":
      return 2;
    default:
      return 1;
  }
};

export function SceneIndex() {
  const { scrollTo } = useLenis();

  return (
    <Section
      id="scenes"
      station="02"
      title="Scenes"
      lede="Four. A scene is a single capture — one system, one problem, one set of decisions. Each one states what was hard and what is still wrong with it."
    >
      {/* The grid stays flat — each card owns its own 3D context, so
          nothing here opens a perspective that would flatten them. */}
      <StaggerGrid className="flex flex-col gap-[0.9rem]" stagger={0.07} flat>
        {scenes.map((scene) => (
          <StaggerCell key={scene.slug} flat>
            {/* alternating side, so cards arrive from opposite depths */}
            <Depth3D side={scene.sceneNumber % 2 === 0 ? "right" : "left"} intensity={1.25}>
            <Tilt3D angle={10}>
            {/* The whole card is the target, not just the title — a 3px
                text link inside a 120px card is a hit-area failure. */}
            <article
              onClick={() => scrollTo(`#scene-${scene.slug}`)}
              className="group grid cursor-pointer grid-cols-[56px_1fr] transition-[box-shadow,border-color] sm:grid-cols-[76px_1fr]"
              style={{
                border: "1px solid var(--line)",
                background: "var(--bg-1)",
                boxShadow: "var(--lift-1)",
                transitionDuration: "var(--d-ui)",
              }}
            >
              <div
                className="flex flex-col items-center gap-2 px-2 py-4"
                style={{ borderRight: "1px solid var(--line)", background: "var(--bg-2)" }}
              >
                <span className="t-mono text-[0.95rem] font-semibold" style={{ color: "var(--mark)" }}>
                  {String(scene.sceneNumber).padStart(2, "0")}
                </span>
                <ElevationBar depth={ownershipDepth(scene.slug)} />
              </div>

              <div className="px-4 py-4 sm:px-5">
                <h3 className="m-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollTo(`#scene-${scene.slug}`);
                    }}
                    className="cursor-pointer border-0 bg-transparent p-0 text-left"
                  >
                    <span
                      className="font-[family-name:var(--font-display)] text-[1.22rem] font-extrabold tracking-[-0.015em] transition-colors group-hover:text-[var(--mark)]"
                      style={{
                        fontVariationSettings: '"wdth" 104',
                        color: "var(--ink-hi)",
                        transitionDuration: "var(--d-tick)",
                      }}
                    >
                      {scene.name}
                    </span>
                    <span className="t-legend ml-2" style={{ color: "var(--ink-lo)" }}>
                      {scene.subtitle}
                    </span>
                  </button>
                </h3>

                <p className="mt-1 mb-3 max-w-[56ch] text-[0.92rem]" style={{ color: "var(--ink-md)" }}>
                  {scene.oneLiner}
                </p>

                <div className="flex flex-wrap items-center gap-[0.3rem]">
                  {scene.stack.slice(0, 5).map((t) => (
                    <span
                      key={t}
                      className="t-mono px-[0.34rem] py-[0.1rem] text-[0.64rem]"
                      style={{ color: "var(--ink-lo)", border: "1px solid var(--line)" }}
                    >
                      {t}
                    </span>
                  ))}
                  {scene.confidence === "attributed" ? (
                    <span
                      className="t-mono px-[0.34rem] py-[0.1rem] text-[0.64rem]"
                      style={{ color: "var(--attributed)", background: "var(--attributed-bg)" }}
                    >
                      shared work
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
            </Tilt3D>
            </Depth3D>
          </StaggerCell>
        ))}
      </StaggerGrid>
    </Section>
  );
}

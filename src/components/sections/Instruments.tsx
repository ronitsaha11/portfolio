import { Section } from "@/components/layout/Section";
import { Depth3D } from "@/components/primitives/Depth3D";
import { StaggerGrid, StaggerCell } from "@/components/primitives/StaggerGrid";
import { Tilt3D } from "@/components/primitives/Tilt3D";
import { PointerParallax } from "@/components/primitives/PointerParallax";
import { capabilities } from "@/data/capabilities";
import { registry } from "@/data/registry";

/**
 * The capability map. Every entry links to the file that proves it —
 * no percentage bars, no star ratings, no logo wall.
 *
 * The 1px gap grid is drawn with a gap over a line-coloured background,
 * so each cell is its own transform target and the stagger composites
 * without repainting the borders.
 */
export function Instruments() {
  return (
    <Section
      id="instruments"
      station="09"
      title="Instruments"
      lede={`${registry.capabilities} entries, and every one links to the file that proves it. Nothing appears here that isn't in code I wrote.`}
    >
      
      <PointerParallax strength={7}>
      <StaggerGrid
        className="grid gap-px sm:grid-cols-2 lg:grid-cols-3"
        stagger={0.05} flat
      >
        {capabilities.map((group, i) => (
          <StaggerCell key={group.group} flat>
            <Depth3D side={i % 2 === 0 ? "left" : "right"} intensity={1.15}>
            <Tilt3D className="h-full" angle={6}>
            <div
              className="h-full px-4 py-4"
              style={{ background: "var(--bg-1)", border: "1px solid var(--line)" }}
            >
              <h3 className="t-legend mt-0 mb-3" style={{ color: "var(--mark)" }}>
                {group.group}
              </h3>
              <ul className="m-0 flex list-none flex-col gap-[0.3rem] p-0">
                {group.items.map((item) => (
                  <li key={item.name} className="text-[0.78rem] leading-snug">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="t-mono no-underline hover:underline"
                      style={{ color: "var(--ink-hi)" }}
                    >
                      {item.name}
                    </a>
                    <span className="t-mono" style={{ color: "var(--ink-lo)" }}>
                      {" "}
                      — {item.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            </Tilt3D>
            </Depth3D>
          </StaggerCell>
        ))}
      </StaggerGrid>
      </PointerParallax>
    </Section>
  );
}

import { Section } from "@/components/layout/Section";
import { Depth3D } from "@/components/primitives/Depth3D";
import { StaggerGrid, StaggerCell } from "@/components/primitives/StaggerGrid";
import { Tilt3D } from "@/components/primitives/Tilt3D";
import { Legend } from "@/components/primitives/Legend";
import { principles } from "@/data/principles";

export function Method() {
  return (
    <Section
      id="method"
      station="07"
      title="Method"
      lede="Four principles, each with the artifact that proves it. These are not aspirations — every one is visible in a commit history someone else can read."
    >
      
      <StaggerGrid className="grid gap-px lg:grid-cols-2" stagger={0.07} flat>
        {principles.map((p, i) => (
          <StaggerCell key={p.id} flat><Depth3D side={i % 2 === 0 ? "left" : "right"} intensity={1.2}>
            <Tilt3D className="h-full">
            <div
              className="h-full px-5 py-5"
              style={{ background: "var(--bg-1)", border: "1px solid var(--line)" }}
            >
              <Legend className="mb-2 block">{String(i + 1).padStart(2, "0")}</Legend>
              <h3 className="t-sub mt-0 mb-2">{p.title}</h3>
              <p className="mb-4 text-[0.94rem]" style={{ color: "var(--ink-md)" }}>
                {p.body}
              </p>
              <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
                {p.provenBy.map((x) => (
                  <li key={x.href}>
                    <a
                      href={x.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="t-mono text-[0.7rem] no-underline hover:underline"
                    >
                      {x.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            </Tilt3D></Depth3D>
          </StaggerCell>
        ))}
      </StaggerGrid>
      
    </Section>
  );
}

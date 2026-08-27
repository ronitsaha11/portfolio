import { Reading } from "@/components/primitives/Reading";
import { Depth3D } from "@/components/primitives/Depth3D";
import { Reveal } from "@/components/primitives/Reveal";
import { Legend } from "@/components/primitives/Legend";
import { LinkButton } from "@/components/primitives/Button";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { DecisionRecordItem } from "./DecisionRecordItem";
import { SceneTitle } from "./SceneTitle";
import { SceneMarker } from "./SceneMarker";
import { ReadingRow } from "@/components/primitives/ReadingRow";
import { Tilt3D } from "@/components/primitives/Tilt3D";
import type { Scene } from "@/data/types";

/**
 * One scene, in the order the reader needs it:
 * problem → invariant → approach → architecture → the hard part →
 * decisions → readings → limitation.
 *
 * The limitation is not optional and is never last-minute filler. A case
 * study with no stated weakness reads as marketing.
 */
export function SceneShell({ scene }: { scene: Scene }) {
  const repoHref = scene.links.find((l) => l.label === "REPOSITORY")?.href ?? "#";

  return (
    <section
      id={`scene-${scene.slug}`}
      className="scroll-mt-[68px] pt-[clamp(5rem,12vw,13rem)]"
      aria-labelledby={`scene-${scene.slug}-title`}
    >
      <div className="mx-auto max-w-[var(--content-max)]">
        <SceneMarker scene={scene} />
        <SceneTitle scene={scene} />

        <div className="mt-10 grid gap-9 lg:grid-cols-[1.05fr_1fr]">
          <Depth3D side="left" text>
            <h3 className="t-sub mt-0 mb-2">The problem</h3>
            <p className="measure text-[0.98rem]" style={{ color: "var(--ink-md)" }}>
              {scene.problem}
            </p>

            <div className="my-6 py-4" style={{ borderBlock: "1px solid var(--line)" }}>
              <Legend className="mb-2 block">The invariant</Legend>
              <p className="measure m-0 text-[1rem]" style={{ color: "var(--ink-hi)" }}>
                {scene.invariant}
              </p>
            </div>

            <h3 className="t-sub mt-0 mb-2">The approach</h3>
            <p className="measure mb-0 text-[0.98rem]" style={{ color: "var(--ink-md)" }}>
              {scene.approach}
            </p>
          </Depth3D>

          <Depth3D side="right" intensity={1.2}>
            <Legend className="mb-3 block">Architecture</Legend>
            <ArchitectureDiagram layers={scene.layers} repoHref={repoHref} />
          </Depth3D>
        </div>

        <Depth3D className="mt-10" side="none" intensity={1.35}>
          <Tilt3D angle={5}>
          <div className="plate p-5 md:p-7">
            <Legend className="mb-2 block">The hard part</Legend>
            <h3 className="t-sub mt-0 mb-3">{scene.hardPart.title}</h3>
            <p className="m-0 max-w-[72ch] text-[0.98rem]" style={{ color: "var(--ink-md)" }}>
              {scene.hardPart.body}
            </p>
          </div>
          </Tilt3D>
        </Depth3D>

        <Depth3D className="mt-10" side="left" intensity={1.1}>
          <ReadingRow readings={scene.readings} />
        </Depth3D>

        {scene.decisions.length > 0 ? (
          <Depth3D className="mt-10" side="right" intensity={1.1}>
            <div className="flex flex-col gap-2">
              {scene.decisions.map((d) => (
                <Tilt3D key={d.id} angle={4} glare={false}>
                  <DecisionRecordItem record={d} />
                </Tilt3D>
              ))}
            </div>
          </Depth3D>
        ) : null}

        <Depth3D className="mt-10" side="left" intensity={1.2}>
          <div
            className="p-4 md:p-5"
            style={{ borderLeft: "2px solid var(--attributed)", background: "var(--attributed-bg)" }}
          >
            <Legend className="mb-1 block" >
              <span style={{ color: "var(--attributed)" }}>What is wrong with it</span>
            </Legend>
            <p className="m-0 max-w-[70ch] text-[0.94rem]" style={{ color: "var(--ink-md)" }}>
              {scene.limitation}
            </p>
          </div>
        </Depth3D>

        <Reveal className="mt-7">
          <div className="flex flex-wrap gap-3">
            {scene.links.map((l, i) => (
              <LinkButton key={l.href} href={l.href} external rank={i === 0 ? "primary" : "ghost"}>
                {l.label === "REPOSITORY"
                  ? "Open the repository"
                  : l.label === "LIVE"
                    ? "Open the live site"
                    : l.label === "SPECIFICATION"
                      ? "Read the specifications"
                      : "See the commits"}
              </LinkButton>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

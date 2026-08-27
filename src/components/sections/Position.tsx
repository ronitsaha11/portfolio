import { Section } from "@/components/layout/Section";
import { Reading } from "@/components/primitives/Reading";
import { Reveal } from "@/components/primitives/Reveal";
import { Tilt3D } from "@/components/primitives/Tilt3D";
import { Depth3D } from "@/components/primitives/Depth3D";
import { positionReadings } from "@/data/readings";
import { site } from "@/data/site";

export function Position() {
  return (
    <Section id="position" station="01" title="Position">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <Depth3D side="left" text>
          <p className="measure text-[1.06rem]" style={{ color: "var(--ink-md)" }}>
            I&apos;m a computer science undergraduate at Lovely Professional University, and most of
            what I know came from building systems slightly larger than I was ready for.
          </p>
          <p className="measure" style={{ color: "var(--ink-md)" }}>
            The pattern is visible in the repositories. TerraMind started as &ldquo;process a
            satellite image&rdquo; and became a platform with a transactional repository layer, a job
            pipeline and a rendering engine — because each of those turned out to be the honest
            answer to a problem I had actually hit. HealthTrack started as a reminder app and became
            an exercise in what it takes for a notification to survive a reboot.
          </p>
          <p className="measure" style={{ color: "var(--ink-md)" }}>
            I work specification-first: write the architecture down, decompose it into small phases,
            and keep the history readable enough that a stranger could follow the reasoning. Slower
            for a day, considerably faster after that. I&apos;m most interested in backend systems,
            geospatial data, and the infrastructure between a model and something a person can use.
          </p>
          <p className="measure mb-0 text-[0.92rem]" style={{ color: "var(--ink-lo)" }}>
            {site.education} · {site.location}
          </p>
        </Depth3D>

        <Depth3D side="right" intensity={1.3}>
          <Tilt3D angle={8} glare={false}>
            <div
              className="grid grid-cols-2 gap-x-6 gap-y-8 p-5"
              style={{ background: "var(--bg-1)", border: "1px solid var(--line)" }}
            >
              {positionReadings.map((r) => (
                <Reading key={r.id} reading={r} />
              ))}
            </div>
          </Tilt3D>
        </Depth3D>
      </div>
    </Section>
  );
}

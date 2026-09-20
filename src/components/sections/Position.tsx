"use client";

import { Chapter } from "@/components/layout/Chapter";
import { Reading } from "@/components/primitives/Reading";
import { Reveal } from "@/components/primitives/Reveal";
import { Stagger } from "@/components/primitives/Stagger";
import { Legend } from "@/components/primitives/Legend";
import { positionReadings } from "@/data/readings";
import { site } from "@/data/site";

export function Position() {
  return (
    <Chapter
      id="position"
      station="01"
      title="Position"
      lede="Where I am, stated as measurements rather than adjectives. Every figure opens the artifact it was counted from."
    >
      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal className="flow">
          <p className="measure text-[1.02rem]" style={{ color: "var(--ink-md)" }}>
            I&apos;m a computer science undergraduate at Lovely Professional University, and most of
            what I know came from building systems slightly larger than I was ready for.
          </p>
          <p className="measure text-[1.02rem]" style={{ color: "var(--ink-md)" }}>
            The pattern is visible in the repositories. TerraMind started as &ldquo;process a
            satellite image&rdquo; and became a platform with a transactional repository layer and a
            job pipeline, because each of those turned out to be the honest answer to a problem I had
            actually hit. HealthTrack started as a reminder app and became an exercise in what it
            takes for a notification to survive a reboot.
          </p>
          <p className="measure text-[1.02rem]" style={{ color: "var(--ink-md)" }}>
            The last year changed the shape of the work rather than the size of it. Cartograph and
            PratiBimb are both codebases with other people in them, which means most of my recent
            output is a reviewed pull request rather than a commit I pushed to my own main — and it
            means the interesting skill stopped being &ldquo;can I build this&rdquo; and started being
            &ldquo;can I write down the decision so the next person does not have to guess.&rdquo;
          </p>
          <p className="measure text-[1.02rem]" style={{ color: "var(--ink-md)" }}>
            I work specification-first: write the architecture down, decompose it into small phases,
            and keep the history readable enough that a stranger could follow the reasoning. Slower
            for a day, considerably faster after that.
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
            <div>
              <dt className="mb-1">
                <Legend>Education</Legend>
              </dt>
              <dd className="m-0 text-[0.9rem]" style={{ color: "var(--ink-md)" }}>
                {site.education}
              </dd>
            </div>
            <div>
              <dt className="mb-1">
                <Legend>Focus</Legend>
              </dt>
              <dd className="m-0 text-[0.9rem]" style={{ color: "var(--ink-md)" }}>
                {site.disciplines.join(" · ")}
              </dd>
            </div>
          </dl>
        </Reveal>

        <Stagger className="grid grid-cols-2 gap-x-8 gap-y-10 self-start" depth>
          {positionReadings.map((r) => (
            <div key={r.id} data-cell="">
              <Reading reading={r} />
            </div>
          ))}
        </Stagger>
      </div>
    </Chapter>
  );
}

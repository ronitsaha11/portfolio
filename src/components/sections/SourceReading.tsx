"use client";

import { Depth3D } from "@/components/primitives/Depth3D";
import { motion } from "motion/react";
import { Section } from "@/components/layout/Section";
import { Reveal } from "@/components/primitives/Reveal";
import { Legend } from "@/components/primitives/Legend";
import { LinkButton } from "@/components/primitives/Button";
import { DUR, EASE } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { terramindSource } from "@/data/scenes";

/**
 * Thirty seconds of a real file, annotated, proves more engineering depth
 * than any skills grid. This is the section no template portfolio has,
 * because it requires the code to actually be defensible.
 *
 * The code arrives first and the annotations follow, line by line — the
 * order someone reads a file when it is being explained to them. The code
 * itself is never animated away from: it is present in the SSR output and
 * only the notes fade in beside it.
 */
export function SourceReading() {
  const { animate } = useMotionPrefs();

  return (
    <Section
      id="source"
      station="08"
      title="Reading the code"
      lede="One real file from TerraMind, with the reasoning attached. Nothing here is simplified for the page — this is the file as it is committed."
    >
      <Depth3D side="none" intensity={1.3}>
        <div className="plate overflow-hidden">
          <div
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-2"
            style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}
          >
            <span className="t-mono text-[0.72rem]" style={{ color: "var(--ink-md)" }}>
              {terramindSource.path}
            </span>
            <Legend>Python · TerraMind AI</Legend>
          </div>

          <div className="overflow-x-auto" data-instrument="">
            <motion.table
              className="w-full border-collapse text-left"
              initial={animate ? "hidden" : false}
              whileInView="shown"
              viewport={{ once: true, amount: 0.2 }}
              variants={{ shown: { transition: { staggerChildren: 0.07 } } }}
            >
              <caption className="sr-only">
                Annotated source of the Unit of Work implementation
              </caption>
              {/* Real headers, visually hidden: the table is genuinely
                  tabular, and without them every cell is header-less. */}
              <thead className="sr-only">
                <tr>
                  <th scope="col">Line</th>
                  <th scope="col">Source</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody>
                {terramindSource.lines.map((line) => (
                  <tr key={line.n} style={{ borderBottom: "1px solid var(--line)" }}>
                    <th
                      scope="row"
                      className="t-mono w-[3rem] px-3 py-2 text-left align-top text-[0.68rem] font-normal select-none"
                      style={{ color: "var(--ink-lo)", background: "var(--bg-2)" }}
                    >
                      {line.n}
                    </th>
                    <td
                      className="t-mono px-3 py-2 align-top text-[0.76rem] whitespace-pre"
                      style={{ color: "var(--ink-hi)" }}
                    >
                      {line.code}
                    </td>
                    <td
                      className="px-3 py-2 align-top text-[0.82rem]"
                      style={{ color: "var(--ink-md)", minWidth: "16rem" }}
                    >
                      {line.note ? (
                        <motion.span
                          className="flex gap-2"
                          variants={{
                            hidden: { opacity: 0, x: -6 },
                            shown: {
                              opacity: 1,
                              x: 0,
                              transition: { duration: DUR.ui, ease: EASE.settle },
                            },
                          }}
                        >
                          <span aria-hidden="true" style={{ color: "var(--mark)" }}>
                            ←
                          </span>
                          {line.note}
                        </motion.span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </motion.table>
          </div>
        </div>
      </Depth3D>

      <Reveal delay={0.06} className="mt-5">
        <LinkButton href={terramindSource.href} external rank="ghost">
          Read the whole file
        </LinkButton>
      </Reveal>
    </Section>
  );
}

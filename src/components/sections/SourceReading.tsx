"use client";

import { Chapter } from "@/components/layout/Chapter";
import { Reveal } from "@/components/primitives/Reveal";
import { Stagger } from "@/components/primitives/Stagger";
import { Legend } from "@/components/primitives/Legend";
import { LinkButton } from "@/components/primitives/Button";
import { terramindSource } from "@/data/scenes";

/**
 * Thirty seconds of a real file, annotated.
 *
 * This is the section no template portfolio has, because it requires
 * the code to actually be defensible — and it requires the excerpt to
 * match the file. An earlier version of this page did not: the line
 * numbers were written from memory and every one was wrong, the guard
 * clauses were missing, and it described seven repositories where the
 * file constructs nine. Anyone who followed the link could see it in
 * about four seconds. The lines below were read back out of the
 * committed file.
 */
export function SourceReading() {
  return (
    <Chapter
      id="source"
      station="11"
      title="Reading the code"
      lede="One real file from TerraMind, with the reasoning attached. Nothing here is simplified for the page — the line numbers are the file's own, and the link goes to the same lines."
    >
      <Reveal>
        <div className="plate overflow-hidden">
          <div
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-2"
            style={{ borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}
          >
            <span className="t-mono text-[0.73rem]" style={{ color: "var(--ink-md)" }}>
              {terramindSource.path}
            </span>
            <Legend>Python · TerraMind AI</Legend>
          </div>

          <div className="overflow-x-auto" data-instrument="">
            <Stagger as="table" className="w-full border-collapse text-left">
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
                      className="t-mono px-3 py-2 align-top text-[0.77rem] whitespace-pre"
                      style={{ color: "var(--ink-hi)" }}
                    >
                      {line.code}
                    </td>
                    <td
                      className="px-3 py-2 align-top text-[0.83rem]"
                      style={{ color: "var(--ink-md)", minWidth: "16rem" }}
                    >
                      {line.note ? (
                        <span data-cell="" className="flex gap-2">
                          <span aria-hidden="true" style={{ color: "var(--mark)" }}>
                            ←
                          </span>
                          {line.note}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Stagger>
          </div>
        </div>
      </Reveal>

      <Reveal delay={60} className="mt-6">
        <LinkButton href={terramindSource.href} rank="ghost">
          Read the whole file
        </LinkButton>
      </Reveal>
    </Chapter>
  );
}

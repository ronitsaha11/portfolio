"use client";

import { Chapter } from "@/components/layout/Chapter";
import { Stagger } from "@/components/primitives/Stagger";
import { Legend } from "@/components/primitives/Legend";
import { principles } from "@/data/principles";

export function Method() {
  return (
    <Chapter
      id="method"
      station="10"
      title="Method"
      lede="Four principles, each with the artifact that proves it. These are not aspirations — every one is visible in a commit history someone else can read, and one of them is about recording the results that went against me."
    >
      <Stagger className="grid-hair lg:grid-cols-2" depth>
        {principles.map((p, i) => (
          <div key={p.id} data-cell="" className="flex h-full flex-col px-6 py-6">
            <div className="mb-3 flex items-baseline gap-3">
              <span className="t-mono text-[0.78rem]" style={{ color: "var(--mark)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="t-sub m-0 flex-1">{p.title}</h3>
            </div>

            <p className="mb-5 flex-1 text-[0.95rem] leading-[1.55]" style={{ color: "var(--ink-md)" }}>
              {p.body}
            </p>

            <div>
              <Legend className="mb-2 block">Proven by</Legend>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {p.provenBy.map((x) => (
                  <li key={x.href}>
                    <a
                      href={x.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="t-mono text-[0.72rem] no-underline hover:underline"
                    >
                      {x.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </Stagger>
    </Chapter>
  );
}

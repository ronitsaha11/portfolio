"use client";

import { Chapter } from "@/components/layout/Chapter";
import { Stagger } from "@/components/primitives/Stagger";
import { capabilities } from "@/data/capabilities";
import { registry } from "@/data/registry";

/**
 * The capability map. Every entry links to the file that proves it —
 * no percentage bars, no star ratings, no logo wall.
 *
 * The link-checking gate is what keeps this section honest. Seven of
 * these entries used to point at files that had never existed in the
 * repository they claimed; they were plausible paths someone had
 * written from memory, and nothing checked them until `verify:links`
 * requested every one and got a 404.
 */
export function Instruments() {
  return (
    <Chapter
      id="instruments"
      station="12"
      title="Instruments"
      lede={`${registry.capabilities} entries, and every one links to the file that proves it. Nothing appears here that isn't in code I wrote, and every link is requested on each build.`}
    >
      <Stagger className="grid-hair sm:grid-cols-2 lg:grid-cols-3" depth>
        {capabilities.map((group) => (
          <div key={group.group} data-cell="" className="h-full px-5 py-5">
            <h3 className="t-legend mt-0 mb-3" style={{ color: "var(--mark)" }}>
              {group.group}
            </h3>
            <ul className="m-0 flex list-none flex-col gap-[0.35rem] p-0">
              {group.items.map((item) => (
                <li key={item.name} className="text-[0.79rem] leading-snug">
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
        ))}
      </Stagger>
    </Chapter>
  );
}

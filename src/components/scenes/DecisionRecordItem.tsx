import { Legend } from "@/components/primitives/Legend";
import type { DecisionRecord } from "@/data/types";

/**
 * An architecture decision record, rendered with the rejected options
 * kept visible. The options you turned down say more than the one you
 * took, which is exactly why most portfolios delete them.
 */
export function DecisionRecordItem({ record }: { record: DecisionRecord }) {
  return (
    <details className="plate group p-4" style={{ boxShadow: "var(--lift-1)" }}>
      <summary className="flex cursor-pointer list-none items-baseline gap-3">
        <Legend>Decision</Legend>
        <span
          className="flex-1 font-[family-name:var(--font-display)] text-[1rem] font-bold"
          style={{ fontVariationSettings: '"wdth" 104', color: "var(--ink-hi)" }}
        >
          {record.title}
        </span>
        <span
          aria-hidden="true"
          className="t-mono text-[0.8rem] transition-transform group-open:rotate-45"
          style={{ color: "var(--mark)", transitionDuration: "var(--d-tick)" }}
        >
          +
        </span>
      </summary>

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <Legend className="mb-1 block">Context</Legend>
          <p className="measure m-0 text-[0.92rem]" style={{ color: "var(--ink-md)" }}>
            {record.context}
          </p>
        </div>

        <div>
          <Legend className="mb-2 block">Options</Legend>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {record.options.map((o) => (
              <li key={o.option} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="t-mono mt-[0.15rem] shrink-0 text-[0.7rem]"
                  style={{ color: o.rejected ? "var(--ink-lo)" : "var(--measured)" }}
                >
                  {o.rejected ? "✕" : "✓"}
                </span>
                <p className="m-0 text-[0.9rem]" style={{ color: "var(--ink-md)" }}>
                  <span
                    style={{
                      color: o.rejected ? "var(--ink-lo)" : "var(--ink-hi)",
                      textDecoration: o.rejected ? "line-through" : "none",
                      textDecorationColor: "var(--line-strong)",
                      fontWeight: o.rejected ? 400 : 600,
                    }}
                  >
                    {o.option}
                  </span>
                  {" — "}
                  {o.reason}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Legend className="mb-1 block">Decision</Legend>
          <p className="measure m-0 text-[0.92rem]" style={{ color: "var(--ink-hi)" }}>
            {record.decision}
          </p>
        </div>

        <div>
          <Legend className="mb-1 block">Consequence</Legend>
          <p className="measure m-0 text-[0.92rem]" style={{ color: "var(--ink-md)" }}>
            {record.consequence}
          </p>
        </div>
      </div>
    </details>
  );
}

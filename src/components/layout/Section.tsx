import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Section({
  id,
  station,
  title,
  lede,
  children,
  className,
  full = false,
}: {
  id: string;
  station?: string;
  title?: string;
  lede?: ReactNode;
  children: ReactNode;
  className?: string;
  full?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-[68px] pt-[clamp(4rem,10vw,10rem)]", className)}
      aria-labelledby={title ? `${id}-title` : undefined}
    >
      <div className={cn(full ? "w-full" : "mx-auto max-w-[var(--content-max)]")}>
        {title ? (
          <div
            className="mb-7 flex items-baseline gap-4 pb-2"
            style={{ borderBottom: "1.5px solid var(--ink-hi)" }}
          >
            {station ? (
              <span className="t-mono text-[0.72rem] font-semibold" style={{ color: "var(--mark)" }}>
                {station}
              </span>
            ) : null}
            <h2 id={`${id}-title`} className="t-section m-0 flex-1">
              {title}
            </h2>
          </div>
        ) : null}

        {lede ? (
          <p className="measure mb-6 text-[1.06rem]" style={{ color: "var(--ink-md)" }}>
            {lede}
          </p>
        ) : null}

        {children}
      </div>
    </section>
  );
}

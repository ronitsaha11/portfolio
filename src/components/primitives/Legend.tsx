import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** Wide + tiny. The map-legend voice — labels, eyebrows, station names. */
export function Legend({
  children,
  className,
  rule = false,
}: {
  children: ReactNode;
  className?: string;
  rule?: boolean;
}) {
  if (rule) {
    return (
      <p className={cn("t-legend m-0 flex items-center gap-3", className)} style={{ color: "var(--mark)" }}>
        {children}
        <span aria-hidden="true" className="h-px flex-1" style={{ background: "var(--line-strong)" }} />
      </p>
    );
  }

  return (
    <span className={cn("t-legend", className)} style={{ color: "var(--ink-lo)" }}>
      {children}
    </span>
  );
}

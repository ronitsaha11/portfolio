import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

/**
 * Wide + tiny. The map-legend voice — labels, eyebrows, station names.
 *
 * Extra attributes are forwarded to the rendered element, which is not
 * housekeeping: the act sequencer finds its targets by `data-in`, and
 * a component that silently swallows a `data-*` attribute produces an
 * element that never animates and a TypeScript check that passes
 * anyway — JSX exempts hyphenated attribute names from excess-property
 * checking, so nothing would have caught it.
 */
export function Legend({
  children,
  className,
  rule = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  rule?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className">) {
  if (rule) {
    return (
      <p
        className={cn("t-legend m-0 flex items-center gap-3", className)}
        style={{ color: "var(--mark)" }}
        {...rest}
      >
        {children}
        <span aria-hidden="true" className="h-px flex-1" style={{ background: "var(--line-strong)" }} />
      </p>
    );
  }

  return (
    <span className={cn("t-legend", className)} style={{ color: "var(--ink-lo)" }} {...rest}>
      {children}
    </span>
  );
}

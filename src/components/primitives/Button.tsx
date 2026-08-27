import { cn } from "@/lib/cn";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Rank = "primary" | "ghost" | "quiet";

const base =
  "inline-flex items-center gap-2 font-[family-name:var(--font-display)] font-semibold text-[0.8rem] " +
  "tracking-[0.02em] px-[1.1rem] py-[0.62rem] border transition-[background-color,border-color,color,transform] " +
  "active:translate-y-px cursor-pointer";

const ranks: Record<Rank, string> = {
  primary:
    "bg-[var(--mark)] border-[var(--mark)] text-[var(--mark-on)] hover:bg-[var(--mark-hi)] hover:border-[var(--mark-hi)]",
  ghost:
    "bg-transparent border-[var(--line-strong)] text-[var(--ink-hi)] hover:border-[var(--mark)] hover:text-[var(--mark)] hover:bg-[var(--mark-dim)]",
  quiet:
    "bg-transparent border-transparent text-[var(--ink-md)] px-[0.3rem] hover:text-[var(--mark)]",
};

/** Three ranks only. One primary action per view. */
export function Button({
  rank = "primary",
  className,
  children,
  ...rest
}: { rank?: Rank; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, ranks[rank], className)}
      style={{ fontVariationSettings: '"wdth" 112', transitionDuration: "var(--d-tick)" }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  rank = "ghost",
  className,
  children,
  external,
  ...rest
}: { rank?: Rank; children: ReactNode; external?: boolean } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(base, ranks[rank], "no-underline", className)}
      style={{ fontVariationSettings: '"wdth" 112', transitionDuration: "var(--d-tick)" }}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
      {external ? <span aria-hidden="true">↗</span> : null}
    </a>
  );
}

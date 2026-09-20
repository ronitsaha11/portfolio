import { cn } from "@/lib/cn";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Rank = "primary" | "ghost" | "quiet";

const base =
  "inline-flex items-center justify-center gap-2 font-[family-name:var(--font-display)] font-semibold " +
  "text-[0.82rem] tracking-[0.02em] px-[1.2rem] py-[0.7rem] border cursor-pointer " +
  "transition-[background-color,border-color,color] active:translate-y-px";

const ranks: Record<Rank, string> = {
  primary:
    "bg-[var(--mark)] border-[var(--mark)] text-[var(--mark-on)] hover:bg-[var(--mark-hi)] hover:border-[var(--mark-hi)]",
  ghost:
    "bg-transparent border-[var(--line-strong)] text-[var(--ink-hi)] hover:border-[var(--mark)] hover:text-[var(--mark)] hover:bg-[var(--mark-dim)]",
  // `rule-in` draws the underline from the side the pointer arrived
  // on rather than from the middle — the difference between an
  // underline and an underline that was drawn.
  quiet:
    "rule-in bg-transparent border-transparent text-[var(--ink-md)] px-[0.35rem] hover:text-[var(--mark)]",
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

/**
 * The link form.
 *
 * `external` is inferred from the href rather than passed, because the
 * one that matters — `rel="noopener noreferrer"` on a `target="_blank"`
 * link — is a security property and should not depend on a caller
 * remembering a prop. A `mailto:` or in-page anchor opens in place.
 *
 * A PDF counts as leaving too. `/resume.pdf` is same-origin, but
 * replacing the page with a PDF viewer throws away the reader's scroll
 * position in a forty-thousand-pixel document and gives them the
 * browser's Back button as the only way home. It gets its own tab for
 * the same reason a GitHub link does.
 */
export function LinkButton({
  rank = "ghost",
  className,
  children,
  href = "#",
  ...rest
}: { rank?: Rank; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^https?:\/\//i.test(href);
  const newTab = external || /\.pdf($|[?#])/i.test(href);

  return (
    <a
      href={href}
      className={cn(base, ranks[rank], "no-underline", className)}
      style={{ fontVariationSettings: '"wdth" 112', transitionDuration: "var(--d-tick)" }}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
      {newTab ? <span aria-hidden="true">↗</span> : null}
    </a>
  );
}

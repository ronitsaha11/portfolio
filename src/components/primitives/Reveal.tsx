"use client";

import { useReveal, type RevealVariant } from "@/hooks/useReveal";
import type { ComponentType, ElementType, ReactNode } from "react";

/**
 * `as` is widened to a props-agnostic ElementType before it is used as
 * a tag.
 *
 * Left as the bare union, TypeScript intersects the props of every
 * member of `ElementType` and resolves `ref`, `className` and
 * `children` to `never`, so a correct call fails to compile. The cast
 * is the standard escape for a polymorphic component and it is
 * deliberately narrow: only the tag name is untyped, and every prop
 * below it is still checked against the component's own signature.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PolymorphicTag = ComponentType<any>;

/**
 * ENTER / REVEAL, applied once when the content first arrives.
 *
 * With motion off this renders a plain element with no wrapper state,
 * no transform and nothing to reverse — the server output stands as the
 * finished page. See `useReveal` for the failsafe that guarantees
 * content is never left hidden.
 */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  selector,
  stagger,
  className,
  as = "div",
}: {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  /** Animate descendants matching this selector instead of the wrapper. */
  selector?: string;
  stagger?: number;
  className?: string;
  as?: ElementType;
}) {
  const ref = useReveal<HTMLDivElement>({ variant, delay, selector, stagger });
  const Tag = as as PolymorphicTag;
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/**
 * REVEAL on a block of text: uncovered by clip, left to right, like a
 * scan line passing over it.
 *
 * The text stays one DOM node — no per-character spans — so it remains
 * selectable, copyable and read as a single sentence by a screen
 * reader. A per-character stagger would do none of those things and
 * would delay the reader getting the sentence, which is the one thing a
 * headline is for.
 *
 * TWO ELEMENTS, and the split is load-bearing: the outer element is
 * what the scroll observer measures, and the inner one carries the
 * clip. Clipping the observed element shrinks its own visible area,
 * which is how you build a reveal that can never satisfy its own
 * threshold and leaves the text permanently invisible.
 */
export function RevealText({
  children,
  as = "span",
  className,
  delay = 0,
  id,
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  id?: string;
  style?: React.CSSProperties;
}) {
  const ref = useReveal<HTMLSpanElement>({ variant: "clip", delay, selector: "[data-clip]" });
  const Tag = as as PolymorphicTag;

  return (
    <Tag id={id} className={className} style={style} ref={ref}>
      <span data-clip="" style={{ display: "block" }}>
        {children}
      </span>
    </Tag>
  );
}

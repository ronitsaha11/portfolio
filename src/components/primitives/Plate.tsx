import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/**
 * The one surface primitive. Square corners, a hairline, and two
 * registration marks in opposite corners — the fiducials on an aerial
 * survey frame. Every raised surface on the site is one of these.
 */
export function Plate({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "aside";
}) {
  return <Tag className={cn("plate", className)}>{children}</Tag>;
}

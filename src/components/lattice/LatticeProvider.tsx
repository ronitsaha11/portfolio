"use client";

import type { ReactNode } from "react";
import { LatticeDirector } from "./LatticeDirector";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";

/**
 * The client boundary for the lattice.
 *
 * The director needs to know whether motion is wanted, and that is a
 * client-only fact. Keeping the read here means the page itself stays
 * a server component and every section below can be one too unless it
 * genuinely needs the browser.
 */
export function LatticeProvider({ children }: { children: ReactNode }) {
  const { depth } = useMotionPrefs();
  return <LatticeDirector enabled={depth}>{children}</LatticeDirector>;
}

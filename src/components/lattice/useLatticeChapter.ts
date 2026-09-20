"use client";

import { useCallback, useRef } from "react";
import { useLattice } from "./LatticeDirector";
import type { LatticePose } from "./state";

/**
 * Register a section as a chapter of the lattice.
 *
 * A section hands back a ref and, optionally, the pose it wants. It
 * never touches the 3D scene, never imports three.js, and renders
 * exactly the same whether or not the canvas ever loads — which is why
 * every section on this site is a server component or a thin client one
 * rather than a WebGL host.
 */
export function useLatticeChapter<T extends HTMLElement>(id: string, pose?: LatticePose) {
  const { register } = useLattice();
  const poseRef = useRef(pose);
  poseRef.current = pose;

  return useCallback(
    (el: T | null) => {
      register(id, el, poseRef.current);
    },
    [id, register],
  );
}

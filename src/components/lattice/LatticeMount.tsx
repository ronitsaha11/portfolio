"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";

/**
 * Mount policy for the lattice.
 *
 * three.js is by a wide margin the heaviest thing this page can load,
 * so it is imported in the browser only, after first paint, and only
 * once motion is confirmed wanted. A static import here would put the
 * whole renderer in the first-load chunk and undo the point of having
 * one canvas in the first place.
 *
 * The delay is not a guess at "when the page is ready": it waits for
 * the load event and then for the browser to be idle. The page is
 * fully readable and fully navigable the entire time; the lattice is
 * additive by construction, which is the whole loading strategy —
 * text, then interface, then the scene, and no blocking screen
 * anywhere in it.
 *
 * THERE IS NO VIEWPORT GATE ANY MORE. The previous build refused to
 * mount below 768px, which meant the page went flat on the device most
 * visitors will open it on. A phone gets a real scene at the LOW tier
 * instead — fewer nodes, no post-processing, a shallower parallax. The
 * only things that stop the canvas existing are a reader asking for
 * reduced motion and a browser that cannot give us a context.
 */
const LatticeCanvas = dynamic(
  () => import("./LatticeCanvas").then((m) => m.LatticeCanvas),
  { ssr: false },
);

/**
 * Can this browser give us a context, and is it a real one?
 *
 * WebGL can be absent for reasons that have nothing to do with the
 * hardware: a blocklisted driver, a privacy extension, an enterprise
 * policy, or a machine that has simply run out of contexts. Asking
 * first costs one throwaway canvas; not asking means three.js loads,
 * fails, and logs an error on a page that was perfectly fine without
 * it. The probe's own context is released immediately so it does not
 * consume one of the browser's limited slots.
 *
 * A SOFTWARE RENDERER IS A NO.
 *
 * SwiftShader, llvmpipe and Microsoft's basic renderer all answer
 * `getContext("webgl2")` perfectly happily and then rasterise every
 * fragment on the CPU — which is the one resource this whole mount
 * policy exists to protect. The number is not subtle: measured on the
 * production build, the same page scored 85 with the scene on a GPU
 * and 50 with it in software, total blocking time going from 183ms to
 * 7.9 seconds. Anything drawing through software gets the semantic
 * page, which is complete on its own.
 *
 * Where the renderer string is hidden — Firefox with fingerprinting
 * resistance on, recent Safari — the test passes. Absence of evidence
 * is not evidence of a software renderer, and refusing the scene on a
 * capable machine is the worse error.
 */
function hasHardwareWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;

    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? "")
      : "";

    const lose = gl.getExtension("WEBGL_lose_context");
    lose?.loseContext();

    return !/swiftshader|llvmpipe|softwarerasterizer|basic render|mesa offscreen/i.test(
      renderer,
    );
  } catch {
    return false;
  }
}

export function LatticeMount() {
  const { depth, ready } = useMotionPrefs();
  const [armed, setArmed] = useState(false);

  /**
   * WAIT FOR THE LOAD EVENT, THEN FOR IDLE.
   *
   * Two gates, and the first one is the important one. Compiling five
   * shader programs and allocating the buffers is a few tens of
   * milliseconds on this machine and several hundred on a throttled
   * one — and on a throttled one it was landing in the middle of
   * hydration, competing with the work that makes the page usable.
   * Measured under Lighthouse's 4x CPU throttle with a real GPU
   * available, mounting during hydration cost about 700ms of blocking
   * time; waiting for `load` first costs none of it, because by then
   * there is nothing left to block.
   *
   * On a fast machine `load` has already fired and the idle callback
   * runs on the next tick, so this changes nothing: the scene is there
   * in well under a second. The delay only appears on machines that
   * are still busy, which is exactly where it should appear.
   */
  useEffect(() => {
    if (!ready || !depth) return;
    if (!hasHardwareWebGL()) return;

    const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    const cic = window.cancelIdleCallback as typeof window.cancelIdleCallback | undefined;
    let handle: number | undefined;
    let timer = 0;

    const arm = () => setArmed(true);
    const queue = () => {
      if (ric) handle = ric(arm, { timeout: 2500 }) as unknown as number;
      else timer = window.setTimeout(arm, 400);
    };

    if (document.readyState === "complete") {
      queue();
      return () => {
        if (handle !== undefined && cic) cic(handle);
        window.clearTimeout(timer);
      };
    }

    window.addEventListener("load", queue, { once: true });
    return () => {
      window.removeEventListener("load", queue);
      if (handle !== undefined && cic) cic(handle);
      window.clearTimeout(timer);
    };
  }, [ready, depth]);

  if (!armed) return null;
  return <LatticeCanvas />;
}

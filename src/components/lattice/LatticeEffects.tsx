"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";

/**
 * THE ONE FULL-SCREEN PASS.
 *
 * This was left out of the first build on the argument that a bloom
 * pass is a full-screen render at DPR² behind a page that is mostly
 * text. That argument was right about the cost and wrong about the
 * value, for one reason: the node shader draws real light, and light
 * that does not bleed reads as a sticker. The accent nodes and the
 * packets are the only fragments in the scene bright enough to cross
 * the threshold, so the pass is doing a specific job on a handful of
 * pixels rather than smearing the whole frame.
 *
 * WHAT KEEPS IT FROM BECOMING "EVERYTHING GLOWS"
 *
 *  - `luminanceThreshold` sits above the base node brightness, so the
 *    grey field does not bloom at all; only accent cores and signals do
 *  - `mipmapBlur` gives a wide, soft falloff at a fraction of the cost
 *    of a large kernel, which is what makes the effect read as light
 *    rather than as a blur filter
 *  - it is mounted only on the high tier, and torn down the moment the
 *    frame monitor steps the tier down
 *
 * The vignette is here rather than in CSS because it has to sit under
 * the bloom: applied on top, it would darken the glow it is supposed to
 * be framing.
 */
export default function LatticeEffects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.42}
        luminanceSmoothing={0.3}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <Vignette offset={0.32} darkness={0.55} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

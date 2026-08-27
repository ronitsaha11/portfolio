"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Legend } from "@/components/primitives/Legend";
import { DUR, EASE } from "@/lib/motion";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import type { ArchitectureLayer } from "@/data/types";

/**
 * The layer stack, in two synchronised views.
 *
 * A 3D stack you can turn, because depth is what the diagram is actually
 * about — a request travels down through these layers — and a flat list
 * of buttons beside it, which is the keyboard and screen-reader path and
 * the precise way to select. Both drive the same selection state.
 *
 * WebGL is loaded only in the browser, only once this scene is on screen,
 * and released again when you scroll past. Four case studies each holding
 * a live context would be four contexts too many.
 */
const ArchitectureStack3D = dynamic(
  () => import("./ArchitectureStack3D").then((m) => m.ArchitectureStack3D),
  { ssr: false },
);

export function ArchitectureDiagram({
  layers,
  repoHref,
}: {
  layers: ArchitectureLayer[];
  repoHref: string;
}) {
  const [activeId, setActiveId] = useState(layers[0]?.id ?? "");
  const active = layers.find((l) => l.id === activeId) ?? layers[0];
  const { animate } = useMotionPrefs();

  const stageRef = useRef<HTMLDivElement>(null);
  const [showStack, setShowStack] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShowStack(true);
      return;
    }

    // Warm the three.js chunk while the browser is idle, so arriving at a
    // scene is a mount rather than a download. Without this the first
    // stack you scroll to has to fetch and parse the chunk first, which
    // is the delay — the module is shared, so one warm-up covers all four.
    const warm = () => void import("./ArchitectureStack3D");
    const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    const idle = ric ? ric(warm) : window.setTimeout(warm, 1200);

    let reported = false;

    // Two separate questions, deliberately.
    //   mount  — wide margin, sticky, so arriving is never a download
    //   render — tight margin, live, so only the visible stack draws
    // Conflating them is what made this either slow to appear or
    // permanently expensive; it needs to be neither.
    const mountIo = new IntersectionObserver(
      (entries) => {
        reported = true;
        for (const e of entries) {
          if (e.isIntersecting) {
            setShowStack(true);
            mountIo.disconnect();
          }
        }
      },
      { rootMargin: "1200px 0px" },
    );
    mountIo.observe(el);

    const renderIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setOnScreen(e.isIntersecting);
      },
      { rootMargin: "120px 0px" },
    );
    renderIo.observe(el);

    // If observers never report, mount the stack anyway. The earlier
    // version left it off, which meant a browser with a flaky observer
    // silently lost every 3D diagram on the page — the exact failure this
    // whole gate was supposed to prevent, inverted.
    const timer = window.setTimeout(() => {
      if (!reported) {
        setShowStack(true);
        setOnScreen(true);
      }
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      const cic = window.cancelIdleCallback as typeof window.cancelIdleCallback | undefined;
      if (ric && cic) cic(idle);
      else window.clearTimeout(idle);
      mountIo.disconnect();
      renderIo.disconnect();
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
      <div>
        <Legend className="mb-2 block">Layers · request order · drag to turn</Legend>

        <div ref={stageRef}>
          {showStack ? (
            <ArchitectureStack3D
              layers={layers}
              activeId={activeId}
              onSelect={setActiveId}
              onScreen={onScreen}
            />
          ) : (
            // Same box as the canvas, so nothing shifts when it arrives,
            // and a flat read of the stack rather than an empty hole.
            <div
              aria-hidden="true"
              className="flex w-full flex-col justify-center gap-[6px]"
              style={{ aspectRatio: "1 / 1", maxHeight: 340 }}
            >
              {layers.map((layer) => (
                <span
                  key={layer.id}
                  className="block h-[10px] w-full"
                  style={{ background: `var(--el-${layer.depth})`, opacity: 0.35 }}
                />
              ))}
            </div>
          )}
        </div>

        <motion.ul
          className="relative m-0 mt-3 flex list-none flex-wrap gap-px p-0"
          style={{ background: "var(--line)", border: "1px solid var(--line)" }}
          initial={animate ? "hidden" : false}
          whileInView="shown"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ shown: { transition: { staggerChildren: 0.06 } } }}
        >
          {layers.map((layer) => {
            const isActive = layer.id === active?.id;
            return (
              <motion.li
                key={layer.id}
                className="flex-1"
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  shown: { opacity: 1, y: 0, transition: { duration: DUR.ui, ease: EASE.settle } },
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(layer.id)}
                  aria-pressed={isActive}
                  className="flex w-full cursor-pointer items-center gap-2 border-0 px-2 py-2 text-left transition-colors"
                  style={{
                    background: isActive ? "var(--mark-dim)" : "var(--bg-1)",
                    transitionDuration: "var(--d-tick)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="block h-[16px] w-[3px] shrink-0"
                    style={{ background: `var(--el-${layer.depth})` }}
                  />
                  <span
                    className="truncate font-[family-name:var(--font-display)] text-[0.76rem] font-semibold"
                    style={{
                      fontVariationSettings: '"wdth" 108',
                      color: isActive ? "var(--mark)" : "var(--ink-hi)",
                    }}
                  >
                    {layer.name}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>

      {active ? (
        <div className="plate p-4">
          <Legend className="mb-2 block">{active.name}</Legend>
          <motion.div
            key={active.id}
            initial={animate ? { opacity: 0, y: 4 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.ui, ease: EASE.settle }}
          >
            <p className="m-0 mb-3 text-[0.92rem]" style={{ color: "var(--ink-md)" }}>
              {active.role}
            </p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {active.modules.map((modulePath) => (
                <li key={modulePath}>
                  <a
                    href={repoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-mono text-[0.72rem] break-all no-underline hover:underline"
                    style={{ color: "var(--ink-md)" }}
                  >
                    {modulePath}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}

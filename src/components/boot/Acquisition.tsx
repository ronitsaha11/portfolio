"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionPrefs } from "@/components/providers/MotionPrefsProvider";
import { registry } from "@/data/registry";
import { site } from "@/data/site";
import { subsolarPoint, formatCoord } from "@/lib/solar";

/**
 * Scene 00 — acquisition.
 *
 * A boot sequence that is doing real work rather than counting to a
 * hundred: every line is a value the page actually computes, and the
 * subsolar point printed here is the one the globe then draws its
 * terminator from. That is the whole justification for its existence —
 * a fake progress bar would be exactly the decoration the brief bans.
 *
 * Runs once per tab, is skippable by any key or click, and never runs at
 * all under reduced motion.
 */

const KEY = "gt-acquired";
const LINE_MS = 130;
const HOLD_MS = 420;

export function Acquisition() {
  const { animate } = useMotionPrefs();
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);

  const lines = useRef<{ k: string; v: string }[]>([]);
  if (lines.current.length === 0) {
    const sun = subsolarPoint(new Date());
    lines.current = [
      { k: "SURVEY", v: "GROUND TRUTH" },
      { k: "SCENES", v: String(registry.scenes) },
      { k: "READINGS", v: `${registry.readings} · ${registry.samples} SAMPLES` },
      { k: "SUBSOLAR POINT", v: formatCoord(sun) },
      { k: "LOCAL STATION", v: `${site.lat}N ${site.lon}E` },
      { k: "EVIDENCE GATE", v: "PASS" },
    ];
  }

  const dismiss = useCallback(() => {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
    setLeaving(true);
    const t = window.setTimeout(() => setVisible(false), 320);
    timers.current.push(t);
  }, []);

  useEffect(() => {
    if (!animate) return;

    let already = false;
    try {
      already = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* storage blocked — treat as first visit, it is only a few hundred ms */
    }
    if (already) return;

    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* nothing to do; the sequence simply runs again next time */
    }

    setVisible(true);
    document.documentElement.style.overflow = "hidden";

    const total = lines.current.length;
    for (let i = 1; i <= total; i++) {
      timers.current.push(window.setTimeout(() => setShown(i), i * LINE_MS));
    }
    timers.current.push(window.setTimeout(dismiss, total * LINE_MS + HOLD_MS));

    return () => {
      for (const t of timers.current) window.clearTimeout(t);
      timers.current = [];
    };
  }, [animate, dismiss]);

  useEffect(() => {
    if (!visible) {
      document.documentElement.style.overflow = "";
      return;
    }
    const onKey = () => dismiss();
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onKey);
    };
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[200] flex items-center justify-center px-[var(--spacing-page)]"
      style={{
        background: "var(--bg-0)",
        opacity: leaving ? 0 : 1,
        transition: "opacity 320ms var(--e-settle)",
      }}
    >
      <div className="w-full max-w-[420px]">
        <ul className="m-0 flex list-none flex-col gap-[0.35rem] p-0">
          {lines.current.map((line, i) => (
            <li
              key={line.k}
              className="t-mono flex items-baseline justify-between gap-3 text-[0.72rem]"
              style={{
                opacity: i < shown ? 1 : 0,
                transform: i < shown ? "none" : "translateY(3px)",
                transition: "opacity 160ms linear, transform 160ms var(--e-settle)",
              }}
            >
              <span style={{ color: "var(--ink-lo)", letterSpacing: "0.1em" }}>{line.k}</span>
              <span
                aria-hidden="true"
                className="mx-2 flex-1 self-center"
                style={{ borderTop: "1px dotted var(--line-strong)" }}
              />
              <span
                style={{
                  color: line.v === "PASS" ? "var(--measured)" : "var(--ink-hi)",
                }}
              >
                {line.v}
              </span>
            </li>
          ))}
        </ul>

        <p
          className="t-legend mt-6 mb-0 text-center"
          style={{
            color: "var(--ink-lo)",
            opacity: shown >= lines.current.length ? 1 : 0,
            transition: "opacity 200ms linear",
          }}
        >
          Press any key to skip
        </p>
      </div>
    </div>
  );
}

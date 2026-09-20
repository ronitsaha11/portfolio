/**
 * THE SCROLL ENGINE — one loop, one listener, one measurement pass.
 *
 * Every scroll-driven thing on this site goes through this module:
 * chapter poses, the case-study acts, reveals, parallax, the rail, the
 * masthead and the lattice's own input sampling. There is exactly one
 * `scroll` listener, exactly one `requestAnimationFrame` loop, and
 * exactly one place that calls `getBoundingClientRect`.
 *
 * WHY THIS REPLACED WHAT WAS HERE BEFORE
 *
 * The page had grown five independent scroll systems: anime.js
 * ScrollObservers (two per chapter, one per reveal, one per parallax —
 * about forty of them), a rAF sampler inside the lattice input module,
 * a scroll listener in the chapter rail that called `setState` on every
 * frame, another in the masthead, and Lenis's own loop. They did not
 * coordinate, they measured the same elements repeatedly, and two of
 * them drove React state at frame rate, which re-rendered the whole
 * page while you were scrolling. That is where the lag was.
 *
 * THE RULES THIS ENFORCES, WHICH ARE THE WHOLE POINT
 *
 *  1. LAYOUT IS READ IN ONE PASS AND NEVER IN THE LOOP. `measure()`
 *     takes every rect it needs back to back, before anything writes.
 *     The frame loop afterwards touches only cached numbers, so it can
 *     never trigger a layout → style → layout cycle no matter how many
 *     subscribers there are.
 *
 *  2. `window.scrollY` IS READ ONCE PER FRAME, at the top, before any
 *     subscriber has written anything. Read after a write it would
 *     force a reflow; read first it is free.
 *
 *  3. A TRACK THAT HAS NOT MOVED COSTS NOTHING. Progress is compared
 *     against the last value it dispatched, so a page at rest runs the
 *     loop and dispatches to nobody.
 *
 *  4. NOTHING HERE TOUCHES REACT STATE. Subscribers get numbers and
 *     write transforms. A component that needs to re-render on a
 *     chapter change subscribes to the director instead, which fires
 *     on boundaries rather than on frames.
 */

export type RangeMode =
  /** Target's top enters the bottom of the viewport → its bottom leaves the top. */
  | "cover"
  /**
   * The pinned range. 0 when the target's top reaches the top of the
   * viewport — the moment a sticky child pins — and 1 when its bottom
   * reaches the bottom of the viewport, when the sticky child releases.
   * This is the one the case-study acts run on.
   */
  | "pin"
  /** Target's top enters the bottom of the viewport → its top reaches the top. */
  | "enter";

export interface ScrollFrame {
  /** Document scroll position, in pixels. */
  y: number;
  /** Pixels travelled since the previous frame. Signed. */
  dy: number;
  /**
   * Scroll speed, 0..1, normalised against a third of the viewport per
   * frame and smoothed. Rises fast, falls slowly — a flick should
   * register at once and then settle.
   */
  velocity: number;
  direction: 1 | -1;
  /** 0..1 down the whole document. */
  progress: number;
  viewport: number;
  /** Seconds since the previous frame, clamped. */
  dt: number;
  /** `performance.now()` at the top of this frame. */
  time: number;
  /** Milliseconds since the reader last scrolled, moved or typed. */
  sinceInput: number;
}

export interface LiveRect {
  left: number;
  right: number;
  width: number;
  height: number;
  /** Document-space top, i.e. `rect.top + scrollY` at measure time. */
  top: number;
}

type RangeCallback = (progress: number, frame: ScrollFrame) => void;
type FrameCallback = (frame: ScrollFrame) => void;

interface Track {
  el: HTMLElement;
  mode: RangeMode;
  cb: RangeCallback;
  start: number;
  end: number;
  last: number;
}

interface Trigger {
  el: HTMLElement;
  /** How far into the viewport the target's top must come, 0..1. */
  reveal: number;
  cb: () => void;
  at: number;
  fired: boolean;
}

interface Watch {
  el: HTMLElement;
  rect: LiveRect;
}

const tracks = new Set<Track>();
const triggers = new Set<Trigger>();
const watches = new Set<Watch>();
const frameSubs = new Set<FrameCallback>();

const frame: ScrollFrame = {
  y: 0,
  dy: 0,
  velocity: 0,
  direction: 1,
  progress: 0,
  viewport: 0,
  dt: 1 / 60,
  time: 0,
  sinceInput: 0,
};

let raf = 0;
let running = false;
let lastTime = 0;
let maxScroll = 0;
let pending = true;
let lastMeasure = 0;
let lastInput = 0;

/** Frame-rate independent damping. Shared with the renderer's `damp`. */
function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * THE ONE PLACE THAT READS LAYOUT.
 *
 * Every rect in the page is taken here, back to back, with nothing
 * written in between — so the browser computes layout once and answers
 * the rest from the same pass. Called on resize, on orientation change,
 * once the fonts have loaded, and when the body's own box changes;
 * never from the frame loop unless something has explicitly asked.
 */
function measure(): void {
  pending = false;
  lastMeasure = frame.time;

  const vh = window.innerHeight || 1;
  const y = window.scrollY;
  frame.viewport = vh;
  maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);

  for (const t of tracks) {
    const r = t.el.getBoundingClientRect();
    const top = r.top + y;
    const h = r.height;

    if (t.mode === "pin") {
      t.start = top;
      t.end = top + h - vh;
    } else if (t.mode === "enter") {
      t.start = top - vh;
      t.end = top;
    } else {
      t.start = top - vh;
      t.end = top + h;
    }
    if (t.end - t.start < 1) t.end = t.start + 1;
    // Force the next frame to dispatch even if the number is unchanged:
    // the geometry moved, so a subscriber holding a derived pixel value
    // needs to hear about it.
    t.last = Number.NaN;
  }

  for (const g of triggers) {
    const r = g.el.getBoundingClientRect();
    g.at = r.top + y - vh * (1 - g.reveal);
  }

  for (const w of watches) {
    const r = w.el.getBoundingClientRect();
    w.rect.left = r.left;
    w.rect.right = r.right;
    w.rect.width = r.width;
    w.rect.height = r.height;
    w.rect.top = r.top + y;
  }
}

function tick(now: number): void {
  raf = requestAnimationFrame(tick);

  // A hidden tab still gets throttled frames in some browsers. Skipping
  // the body keeps the delta from accumulating into one enormous jump
  // when it comes back.
  if (document.visibilityState !== "visible") {
    lastTime = now;
    return;
  }

  const dt = lastTime === 0 ? 1 / 60 : Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  frame.time = now;
  frame.dt = dt;

  if (pending) measure();

  // RULE 2: this is the only layout-dependent read in the loop, and it
  // happens before any subscriber has written a single style.
  const y = window.scrollY;
  const dy = y - frame.y;
  frame.y = y;
  frame.dy = dy;
  if (dy !== 0) {
    frame.direction = dy > 0 ? 1 : -1;
    lastInput = now;
  }
  frame.sinceInput = now - lastInput;

  const target = Math.min(1, Math.abs(dy) / (frame.viewport * 0.3 || 1));
  frame.velocity = damp(frame.velocity, target, target > frame.velocity ? 18 : 2.2, dt);
  frame.progress = maxScroll > 0 ? clamp01(y / maxScroll) : 0;

  for (const t of tracks) {
    const p = clamp01((y - t.start) / (t.end - t.start));
    // RULE 3. An epsilon rather than equality: a sub-pixel change in a
    // 700vh range is not a change anyone can see, and dispatching it
    // costs a transform write on every act panel in the section.
    if (Math.abs(p - t.last) < 0.00012) continue;
    t.last = p;
    t.cb(p, frame);
  }

  if (triggers.size > 0) {
    for (const g of triggers) {
      if (g.fired || y < g.at) continue;
      g.fired = true;
      triggers.delete(g);
      g.cb();
    }
  }

  for (const f of frameSubs) f(frame);
}

function start(): void {
  if (running || typeof window === "undefined") return;
  running = true;
  lastTime = 0;
  lastInput = performance.now();
  pending = true;
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
  window.addEventListener("pointerdown", onInput, { passive: true });
  window.addEventListener("pointermove", onInput, { passive: true });
  window.addEventListener("keydown", onInput, { passive: true });
  bodyObserver?.observe(document.body);
  document.fonts?.ready.then(() => {
    pending = true;
  });
  raf = requestAnimationFrame(tick);
}

function stop(): void {
  if (!running) return;
  if (tracks.size || triggers.size || watches.size || frameSubs.size) return;
  running = false;
  cancelAnimationFrame(raf);
  window.removeEventListener("resize", onResize);
  window.removeEventListener("orientationchange", onResize);
  window.removeEventListener("pointerdown", onInput);
  window.removeEventListener("pointermove", onInput);
  window.removeEventListener("keydown", onInput);
  bodyObserver?.disconnect();
}

function onResize(): void {
  pending = true;
}

function onInput(): void {
  lastInput = performance.now();
}

/**
 * The body's own box changes when an image decodes or a details element
 * opens, and every cached offset below it moves. Throttled hard,
 * because a ResizeObserver during a running animation fires on most
 * frames and a measurement pass is the one expensive thing here.
 */
const bodyObserver =
  typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver(() => {
        if (frame.time - lastMeasure > 250) pending = true;
      });

/* ---------------- public API ---------------- */

/**
 * Link a callback to an element's travel through the viewport.
 *
 * The callback receives 0..1 and is called only when that number
 * changes. It must not read layout and must not set React state.
 */
export function trackRange(
  el: HTMLElement,
  mode: RangeMode,
  cb: RangeCallback,
): () => void {
  const t: Track = { el, mode, cb, start: 0, end: 1, last: Number.NaN };
  tracks.add(t);
  pending = true;
  start();
  return () => {
    tracks.delete(t);
    stop();
  };
}

/**
 * Fire once, when the element has come `reveal` of the viewport height
 * up from the bottom edge. The utility case the brief still allows an
 * observer for: an arrival that should happen once and never again.
 */
export function trackOnce(el: HTMLElement, reveal: number, cb: () => void): () => void {
  const g: Trigger = { el, reveal, cb, at: Number.POSITIVE_INFINITY, fired: false };
  triggers.add(g);
  pending = true;
  start();
  return () => {
    triggers.delete(g);
    stop();
  };
}

/**
 * Keep a live, cached rect for an element.
 *
 * The returned object is mutated in place on every measurement pass, so
 * a caller can read `rect.left` inside the frame loop without touching
 * the DOM. This is how the lattice finds the reading column.
 */
export function watchRect(el: HTMLElement): { rect: LiveRect; release: () => void } {
  const rect: LiveRect = { left: 0, right: 0, width: 0, height: 0, top: 0 };
  const w: Watch = { el, rect };
  watches.add(w);
  pending = true;
  start();
  return {
    rect,
    release: () => {
      watches.delete(w);
      stop();
    },
  };
}

/** Every frame, whether or not anything moved. For damped values. */
export function onFrame(cb: FrameCallback): () => void {
  frameSubs.add(cb);
  start();
  return () => {
    frameSubs.delete(cb);
    stop();
  };
}

/** Ask for a fresh measurement pass at the top of the next frame. */
export function remeasure(): void {
  pending = true;
}

/** The live frame object. Read-only by convention; mutated by the loop. */
export function scrollFrame(): ScrollFrame {
  return frame;
}

/**
 * Where a track's progress value sits in document pixels.
 *
 * Used by the case-study stage to send the page to a particular act
 * when focus lands inside one — keyboard navigation has to be able to
 * move the scroll position, not just the focus ring.
 */
export function rangeToScrollY(el: HTMLElement, mode: RangeMode, progress: number): number {
  for (const t of tracks) {
    if (t.el === el && t.mode === mode) return t.start + (t.end - t.start) * progress;
  }
  return window.scrollY;
}

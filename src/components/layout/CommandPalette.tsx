"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLenis } from "@/components/providers/LenisProvider";
import { chapters, site } from "@/data/site";
import { scenes } from "@/data/scenes";

/**
 * Direct navigation for people who would rather type than scroll.
 *
 * ⌘K / Ctrl-K, or the button in the masthead. It is strictly additive:
 * every destination in it is also reachable by scrolling, by the
 * chapter rail, and by the mobile sheet. Novelty that becomes the only
 * route to something is a usability bug, so this one is never the only
 * route to anything.
 *
 * Built as a real combobox rather than a div with key handlers:
 * `role="combobox"` on the input, `aria-expanded`, `aria-controls`, a
 * `role="listbox"` of `role="option"`s, and `aria-activedescendant`
 * tracking the highlighted row — which is what lets a screen reader
 * announce the selection while focus stays in the text field. Escape
 * closes, focus returns to whatever opened it, and Tab is not trapped
 * in a way that can strand anyone.
 */

interface Entry {
  id: string;
  label: string;
  hint: string;
  kind: "chapter" | "system" | "link";
  href?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { scrollTo } = useLenis();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const listId = useId();

  const entries = useMemo<Entry[]>(() => {
    const chapterEntries: Entry[] = chapters.map((c) => ({
      id: c.id,
      label: c.label,
      hint: c.kind === "scene" ? "Case study" : `Chapter ${c.station}`,
      kind: c.kind === "scene" ? "system" : "chapter",
    }));

    const repoEntries: Entry[] = scenes.map((s) => ({
      id: `repo-${s.slug}`,
      label: `${s.name} — repository`,
      hint: s.category,
      kind: "link",
      href: s.links.find((l) => l.label === "REPOSITORY")?.href,
    }));

    const external: Entry[] = [
      { id: "gh", label: "GitHub", hint: site.githubHandle, kind: "link", href: site.github },
      { id: "li", label: "LinkedIn", hint: "saha-ronit", kind: "link", href: site.linkedin },
      { id: "mail", label: "Email", hint: site.email, kind: "link", href: `mailto:${site.email}` },
      { id: "cv", label: "Open the résumé", hint: "PDF", kind: "link", href: site.resume },
    ];

    return [...chapterEntries, ...repoEntries, ...external];
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) => e.label.toLowerCase().includes(q) || e.hint.toLowerCase().includes(q),
    );
  }, [entries, query]);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setIndex(0);
    returnTo.current?.focus();
  }, [onOpenChange]);

  const run = useCallback(
    (entry: Entry | undefined) => {
      if (!entry) return;
      close();
      if (entry.kind === "link" && entry.href) {
        // A PDF opens in its own tab for the same reason an external
        // link does: replacing the page with a PDF viewer discards the
        // reader's position in a very long document.
        const newTab = /^https?:\/\//i.test(entry.href) || /\.pdf($|[?#])/i.test(entry.href);
        window.open(entry.href, newTab ? "_blank" : "_self", "noopener,noreferrer");
        return;
      }
      scrollTo(`#${entry.id}`);
    },
    [close, scrollTo],
  );

  /** ⌘K from anywhere. Ignored while the caret is in a text field. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        returnTo.current = document.activeElement as HTMLElement;
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Keep the highlighted row in view as the arrow keys move it.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [index]);

  if (!open) return null;

  const activeId = results[index] ? `${listId}-${results[index]!.id}` : undefined;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[14vh]"
      style={{
        background: "color-mix(in srgb, var(--bg-0) 72%, transparent)",
        backdropFilter: "blur(3px)",
        animation: "gt-fade-in var(--d-tick) linear",
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to"
        className="w-full max-w-[560px]"
        style={{
          background: "var(--bg-3)",
          border: "1px solid var(--line-strong)",
          boxShadow: "var(--lift-3)",
          // A spatial entrance: it arrives from below and slightly
          // behind, which places it in front of the page rather than
          // on it. The scrim blurs at the same time, so the two read
          // as one gesture.
          animation: "gt-command-in var(--d-ui) var(--e-settle)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
          <span aria-hidden="true" className="t-mono text-[0.8rem]" style={{ color: "var(--mark)" }}>
            ›
          </span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Search chapters, systems and links"
            placeholder="Go to a chapter, a system, a repository…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                close();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(results[index]);
              }
            }}
            className="w-full border-0 bg-transparent text-[0.95rem] outline-none"
            style={{ color: "var(--ink-hi)" }}
          />
          <kbd
            aria-hidden="true"
            className="t-mono hidden shrink-0 px-[0.4rem] py-[0.1rem] text-[0.62rem] sm:block"
            style={{ border: "1px solid var(--line)", color: "var(--ink-lo)" }}
          >
            ESC
          </kbd>
        </div>

        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Destinations"
          className="m-0 max-h-[46vh] list-none overflow-y-auto p-0"
        >
          {results.length === 0 ? (
            <li className="px-4 py-6 text-[0.88rem]" style={{ color: "var(--ink-lo)" }}>
              Nothing matches “{query}”.
            </li>
          ) : (
            results.map((entry, i) => {
              const active = i === index;
              return (
                <li key={entry.id} role="none">
                  <button
                    type="button"
                    id={`${listId}-${entry.id}`}
                    role="option"
                    aria-selected={active}
                    data-active={active}
                    onPointerEnter={() => setIndex(i)}
                    onClick={() => run(entry)}
                    className="flex w-full cursor-pointer items-baseline gap-3 border-0 px-4 py-[0.62rem] text-left"
                    style={{ background: active ? "var(--mark-dim)" : "transparent" }}
                  >
                    <span
                      aria-hidden="true"
                      className="t-mono w-[1.1rem] shrink-0 text-[0.64rem]"
                      style={{ color: active ? "var(--mark)" : "var(--ink-lo)" }}
                    >
                      {entry.kind === "link" ? "↗" : "§"}
                    </span>
                    <span
                      className="flex-1 truncate text-[0.9rem]"
                      style={{ color: active ? "var(--mark)" : "var(--ink-hi)" }}
                    >
                      {entry.label}
                    </span>
                    <span className="t-legend shrink-0" style={{ color: "var(--ink-lo)" }}>
                      {entry.hint}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

"use client";

import { Chapter } from "@/components/layout/Chapter";
import { Reveal } from "@/components/primitives/Reveal";
import { Stagger } from "@/components/primitives/Stagger";
import { Legend } from "@/components/primitives/Legend";
import { LinkButton } from "@/components/primitives/Button";
import { Magnetic } from "@/components/primitives/Magnetic";
import { site } from "@/data/site";
import { registry } from "@/data/registry";

/**
 * No contact form. Forms lose messages, need a backend this site does
 * not otherwise have, and give the visitor no receipt. An address they
 * can copy is strictly better for both sides.
 */
export function Contact() {
  const channels = [
    { label: "Email", value: site.email, href: `mailto:${site.email}` },
    { label: "GitHub", value: site.githubHandle, href: site.github },
    { label: "LinkedIn", value: "saha-ronit", href: site.linkedin },
    { label: "Résumé", value: "PDF", href: site.resume },
  ];

  return (
    <Chapter
      id="contact"
      station="14"
      title="Contact"
      lede={site.availability + "."}
    >
      {/* The page resolves here. Six systems behind you, every figure
          on them linked to what it was measured from — stated as a
          count derived from the data layer, so it cannot drift from
          what the page actually contains. */}
      <Reveal variant="fade">
        <p
          className="t-legend m-0 mb-7 flex items-center gap-3"
          style={{ color: "var(--measured)" }}
        >
          All systems documented
          <span
            aria-hidden="true"
            className="h-px flex-1"
            style={{ background: "var(--line)" }}
          />
          <span style={{ color: "var(--ink-lo)" }}>
            {registry.scenes} systems · {registry.readings} readings · {registry.samples} ground
            samples
          </span>
        </p>
      </Reveal>

      <Reveal>
        <p className="measure text-[1.02rem]" style={{ color: "var(--ink-md)" }}>
          I&apos;m looking for backend, systems or platform work. If you&apos;re building something
          where the infrastructure between a model and a user is the interesting part — or where
          somebody has to decide what the system is allowed to know — that&apos;s the conversation I
          want.
        </p>
      </Reveal>

      <Stagger className="grid-hair mt-8 sm:grid-cols-2 lg:grid-cols-4" depth>
        {channels.map((c) => (
          <div key={c.label} data-cell="" className="px-5 py-5">
            <Legend className="mb-1 block">{c.label}</Legend>
            <a
              href={c.href}
              {...(/^https?:\/\//i.test(c.href) || /\.pdf($|[?#])/i.test(c.href)
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="t-mono text-[0.86rem] break-all no-underline hover:underline"
            >
              {c.value}
            </a>
          </div>
        ))}
      </Stagger>

      <Reveal delay={80} className="mt-8">
        <div className="flex flex-wrap gap-3">
          <Magnetic>
            <LinkButton href={`mailto:${site.email}`} rank="primary">
              Send an email
            </LinkButton>
          </Magnetic>
          <LinkButton href={site.github} rank="ghost">
            GitHub
          </LinkButton>
          <LinkButton href={site.resume} rank="ghost">
            Résumé
          </LinkButton>
          <LinkButton href={site.linkedin} rank="ghost">
            LinkedIn
          </LinkButton>
        </div>
      </Reveal>
    </Chapter>
  );
}

import { allReadings } from "./registry";
import { scenes } from "./scenes";
import { capabilities } from "./capabilities";
import { principles } from "./principles";
import { site } from "./site";

export interface EvidenceLink {
  href: string;
  /** Human-readable citation site, printed when a link fails. */
  where: string;
}

/**
 * Every external link the site renders, with the place that cites it.
 *
 * Consumed by `scripts/verify-links.mjs`, which requests each one. The
 * build gate in `assert.ts` proves a reading *has* an artifact; this
 * proves the artifact is still there. Those are different failures and
 * only the first one was ever being caught.
 */
export function evidenceLinks(): EvidenceLink[] {
  const out: EvidenceLink[] = [];

  for (const r of allReadings) {
    for (const s of r.samples) {
      out.push({ href: s.href, where: `reading "${r.id}" → sample "${s.label}"` });
    }
  }

  for (const scene of scenes) {
    for (const l of scene.links) {
      out.push({ href: l.href, where: `scene "${scene.slug}" → ${l.label}` });
    }
  }

  for (const group of capabilities) {
    for (const item of group.items) {
      out.push({ href: item.href, where: `capability "${group.group} / ${item.name}"` });
    }
  }

  for (const p of principles) {
    for (const x of p.provenBy) {
      out.push({ href: x.href, where: `principle "${p.id}" → ${x.label}` });
    }
  }

  out.push({ href: site.github, where: "site.github" });
  out.push({ href: site.linkedin, where: "site.linkedin" });

  return out;
}

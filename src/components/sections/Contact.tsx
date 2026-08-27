import { Section } from "@/components/layout/Section";
import { Depth3D } from "@/components/primitives/Depth3D";
import { Reveal } from "@/components/primitives/Reveal";
import { Legend } from "@/components/primitives/Legend";
import { LinkButton } from "@/components/primitives/Button";
import { site } from "@/data/site";

/**
 * No contact form. Forms lose messages, need a backend this site does not
 * otherwise have, and give the visitor no receipt.
 */
export function Contact() {
  const channels = [
    { label: "Email", value: site.email, href: `mailto:${site.email}` },
    { label: "GitHub", value: site.githubHandle, href: site.github },
    { label: "LinkedIn", value: "saha-ronit", href: site.linkedin },
  ];

  return (
    <Section id="contact" station="11" title="Contact">
      <Reveal>
        <p className="measure text-[1.06rem]" style={{ color: "var(--ink-md)" }}>
          I&apos;m looking for backend, systems or geospatial work — an internship or a new-grad
          role. If you&apos;re building something where the infrastructure between a model and a
          user is the interesting part, that&apos;s the conversation I want.
        </p>
      </Reveal>

      <Depth3D className="mt-7" side="right" intensity={1.25}>
        <dl
          className="grid gap-px sm:grid-cols-3"
          style={{ background: "var(--line)", border: "1px solid var(--line)" }}
        >
          {channels.map((c) => (
            <div key={c.label} className="px-4 py-4" style={{ background: "var(--bg-1)" }}>
              <dt className="mb-1">
                <Legend>{c.label}</Legend>
              </dt>
              <dd className="m-0">
                <a
                  href={c.href}
                  {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="t-mono text-[0.86rem] break-all no-underline hover:underline"
                >
                  {c.value}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </Depth3D>

      <Reveal delay={0.1} className="mt-6">
        <div className="flex flex-wrap gap-3">
          <LinkButton href={`mailto:${site.email}`} rank="primary">
            Send an email
          </LinkButton>
          <LinkButton href={site.github} external rank="ghost">
            Read the code
          </LinkButton>
        </div>
      </Reveal>
    </Section>
  );
}

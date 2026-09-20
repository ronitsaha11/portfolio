import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { MotionPrefsProvider } from "@/components/providers/MotionPrefsProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { site } from "@/data/site";
import { scenes } from "@/data/scenes";
import "./globals.css";

/* Three voices, self-hosted by next/font, so there is no external
   request and no layout shift from a late webfont. */
/* No `weight` here on purpose: requesting the wdth axis requires the
   variable font, which ships the full 100–900 weight range with it —
   and the width axis is what carries hierarchy on this site. */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display-loaded",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

/* Two weights, not three. Each static weight is its own ~10 KB
   preloaded file, and 600 was carrying four labels that 500 renders
   indistinguishably at 0.7–0.8rem. The variable Archivo above is the
   one font that genuinely needs its full axis range. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.concept,
  authors: [{ name: site.name, url: site.github }],
  creator: site.name,
  /* The technologies and domains that actually appear in the work,
     which is also the list a recruiter would search. No keyword
     stuffing: every term below is a thing on this page. */
  keywords: [
    "Ronit Saha",
    "full-stack engineer",
    "systems engineer",
    "backend engineer",
    "static analysis",
    "privacy engineering",
    "geospatial",
    "Rust",
    "FastAPI",
    "TypeScript",
    "Kotlin",
    "portfolio",
  ],
  category: "technology",
  openGraph: {
    type: "profile",
    title: site.title,
    description: site.description,
    url: site.url,
    siteName: site.concept,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: site.url },
};

/* One palette, so one theme colour and no pre-paint script to stamp a
   stored choice. Removing the light pass removed a class of bug with
   it: there is no longer a window in which the browser chrome and the
   page disagree about which ground they are on. */
export const viewport: Viewport = {
  themeColor: "#0B0E0F",
  colorScheme: "dark",
};

/**
 * Structured data.
 *
 * A Person, plus one CreativeWork per system. The `about` list is
 * derived from the scene data rather than written out, so a project
 * added to `src/data/scenes` appears in the structured data, the
 * sitemap, the navigation and the command palette without anyone
 * remembering to update four places.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${site.url}#person`,
      name: site.name,
      email: site.email,
      url: site.url,
      jobTitle: site.role,
      description: site.description,
      knowsAbout: site.disciplines,
      sameAs: [site.github, site.linkedin],
      alumniOf: { "@type": "CollegeOrUniversity", name: "Lovely Professional University" },
      address: { "@type": "PostalAddress", addressLocality: "Jalandhar", addressCountry: "IN" },
    },
    {
      "@type": "ProfilePage",
      "@id": `${site.url}#page`,
      name: site.title,
      description: site.description,
      url: site.url,
      mainEntity: { "@id": `${site.url}#person` },
      about: scenes.map((s) => ({
        "@type": "SoftwareSourceCode",
        name: s.name,
        description: s.oneLiner,
        codeRepository: s.links.find((l) => l.label === "REPOSITORY")?.href,
        programmingLanguage: s.stack.slice(0, 4),
        author: { "@id": `${site.url}#person` },
      })),
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${instrument.variable} ${plexMono.variable}`}>
      {/* No explicit <head> element: rendering one in an App Router
          layout suppresses the entire Metadata API output — no
          description, no Open Graph, no canonical. The JSON-LD below
          sits at the top of <body> instead. */}
      <body>
        {/* THE MOTION FLAG, SET BEFORE THE FIRST PAINT.
            Four lines, inline, synchronous, ahead of any stylesheet
            that reads it. It is what decides whether a case study is
            a pinned scrollytelling frame or an ordinary document, and
            deciding it here rather than in a React effect is worth
            about 1.9 seconds of total blocking time: a mode flip
            after hydration rebuilds and re-lays-out every case study
            on the page. No JavaScript and no attribute means the
            document layout, which is the correct fallback. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)" +
              "document.documentElement.dataset.motion='on'}catch(e){}",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a href="#top" className="skip-link">
          Skip to content
        </a>
        <MotionPrefsProvider>
          <LenisProvider>{children}</LenisProvider>
        </MotionPrefsProvider>
      </body>
    </html>
  );
}

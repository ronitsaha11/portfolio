import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { MotionPrefsProvider } from "@/components/providers/MotionPrefsProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { site } from "@/data/site";
import "./globals.css";

/* Three voices (Phase 2 §04). Self-hosted by next/font, so no external
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

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  authors: [{ name: site.name, url: site.github }],
  creator: site.name,
  keywords: [
    "Ronit Saha",
    "backend engineer",
    "geospatial",
    "FastAPI",
    "Android",
    "Kotlin",
    "TypeScript",
    "portfolio",
  ],
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F2ED" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1213" },
  ],
};

/* Applies the stored pass before first paint, so an explicit night-pass
   choice never flashes the day palette. */
/* Stamps the pass before first paint: a stored choice if there is one,
   otherwise the OS preference. Without the OS fallback a dark-OS visitor
   flashes the day palette before the provider mounts. */
const passScript = `(function(){try{var p=localStorage.getItem("gt-pass");if(p!=="light"&&p!=="dark"){p=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",p)}catch(e){}})()`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  email: site.email,
  url: site.url,
  jobTitle: site.role,
  sameAs: [site.github, site.linkedin],
  alumniOf: { "@type": "CollegeOrUniversity", name: "Lovely Professional University" },
  address: { "@type": "PostalAddress", addressLocality: "Jalandhar", addressCountry: "IN" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${instrument.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      {/* No explicit <head> element: rendering one in an App Router
          layout suppresses the entire Metadata API output — no
          description, no Open Graph, no canonical. The scripts below sit
          at the top of <body> instead, where the pass script still runs
          before any content paints. */}
      <body>
        <script dangerouslySetInnerHTML={{ __html: passScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a href="#position" className="skip-link">
          Skip to content
        </a>
        <MotionPrefsProvider>
          <ThemeProvider>
            <LenisProvider>{children}</LenisProvider>
          </ThemeProvider>
        </MotionPrefsProvider>
      </body>
    </html>
  );
}

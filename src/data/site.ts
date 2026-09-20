import { scenes } from "./scenes";

export const site = {
  name: "Ronit Saha",
  title: "Ronit Saha — Full-stack & systems engineer",
  concept: "Ground Truth",

  /** The one-line positioning statement. Used in the hero and the OG image. */
  thesis: "I build systems the way they'll have to be maintained.",

  /**
   * The paragraph under the name. Two sentences, because a recruiter
   * reads the first one and an engineer reads the second.
   */
  positioning:
    "I design and build the layers between a model and a person — transactional backends, on-device perception, cross-language static analysis. The architecture is written down before the code, and every figure on this page links to the artifact it was measured from.",

  role: "Full-stack & systems engineer",
  disciplines: ["Backend", "Systems", "Geospatial", "Privacy engineering", "Android"],

  /**
   * Ground truth is the remote-sensing term for measured reality — the
   * samples you collect on the ground to check what the satellite
   * claimed from orbit. It is what this site is: every figure checked
   * against what produced it.
   */
  description:
    "Ronit Saha is a full-stack and systems engineer building privacy-preserving perception, cross-language static analysis and geospatial platforms. Every figure on this site links to the code that produced it.",

  education: "B.Tech Computer Science · Lovely Professional University",
  location: "Jalandhar, India",
  availability: "Open to internship and new-grad software engineering roles",
  email: "ronitsaha.edu@gmail.com",
  github: "https://github.com/ronitsaha11",
  githubHandle: "ronitsaha11",
  linkedin: "https://www.linkedin.com/in/saha-ronit/",

  /**
   * Served from `public/`. The file is intentionally not committed —
   * drop a PDF at `public/resume.pdf` and this link starts resolving.
   * See `public/README.md`.
   */
  resume: "/resume.pdf",

  /**
   * Drives metadataBase, the canonical link, Open Graph tags and
   * sitemap.xml. It must be the address the site actually answers on —
   * a canonical pointing at a domain you do not own tells search engines
   * to index somewhere that does not resolve.
   *
   * Change this first if a custom domain is added in Vercel.
   */
  url: "https://proof-navy.vercel.app",

  /** Approximate, for the coordinate readout in the chapter rail. */
  lat: "31.2560",
  lon: "75.7050",
} as const;

export interface Chapter {
  id: string;
  label: string;
  /** Zero-padded station number, in survey order. */
  station: string;
  kind: "chapter" | "scene";
  /**
   * How much there is to read at this station. Drives the rail's
   * profile, so the rail is a real elevation profile of the page rather
   * than a decorative squiggle.
   */
  relief: number;
  /** Scene slug, when this chapter is a case study. */
  slug?: string;
}

/**
 * The chapters, half of them derived.
 *
 * Every scene contributes its own station, so adding a project file
 * updates the rail, the nav, the command palette and the section-aware
 * indicator at once. The hand-written entries are the editorial
 * sections, which have no data source to derive from.
 */
const before: Chapter[] = [
  { id: "position", label: "Position", station: "", kind: "chapter", relief: 0.4 },
  { id: "systems", label: "Selected systems", station: "", kind: "chapter", relief: 0.55 },
];

const sceneChapters: Chapter[] = scenes.map((s) => ({
  id: `scene-${s.slug}`,
  label: s.name,
  station: "",
  kind: "scene" as const,
  relief: s.tier === "flagship" ? 1 : 0.62,
  slug: s.slug,
}));

const after: Chapter[] = [
  { id: "method", label: "Method", station: "", kind: "chapter", relief: 0.45 },
  { id: "source", label: "Reading the code", station: "", kind: "chapter", relief: 0.55 },
  { id: "instruments", label: "Instruments", station: "", kind: "chapter", relief: 0.4 },
  { id: "traverse", label: "Traverse", station: "", kind: "chapter", relief: 0.5 },
  { id: "contact", label: "Contact", station: "", kind: "chapter", relief: 0.22 },
];

/** Numbered once, here, so no station number is ever typed by hand. */
export const chapters: Chapter[] = [...before, ...sceneChapters, ...after].map((c, i) => ({
  ...c,
  station: String(i + 1).padStart(2, "0"),
}));

export const chapterById = (id: string): Chapter | undefined =>
  chapters.find((c) => c.id === id);

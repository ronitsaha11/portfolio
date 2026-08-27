export const site = {
  name: "Ronit Saha",
  title: "Ronit Saha — Ground Truth",
  concept: "Ground Truth",
  thesis: "I build systems the way they'll have to be maintained.",
  /**
   * Ground truth is the remote-sensing term for measured reality — the
   * samples you collect on the ground to check what the satellite claimed
   * from orbit. It is the vocabulary of the flagship project, and it is
   * what this site is: every figure checked against what produced it.
   */
  description:
    "Ronit Saha builds backend, geospatial and Android systems with an architecture-first discipline. Every figure on this site links to the code that produced it.",
  role: "Backend, geospatial and mobile systems",
  education: "B.Tech Computer Science · Lovely Professional University",
  location: "Jalandhar, India",
  email: "ronitsaha.edu@gmail.com",
  github: "https://github.com/ronitsaha11",
  githubHandle: "ronitsaha11",
  linkedin: "https://www.linkedin.com/in/saha-ronit/",
  /**
   * Drives metadataBase, the canonical link, Open Graph tags and
   * sitemap.xml. It must be the address the site actually answers on —
   * a canonical pointing at a domain you do not own tells search engines
   * to index somewhere that does not resolve.
   *
   * Change this first if a custom domain is added in Vercel.
   */
  url: "https://proof-navy.vercel.app",
  /** Approximate, for the coordinate readout in the contour rail. */
  lat: "31.2560",
  lon: "75.7050",
} as const;

/**
 * The survey stations.
 *
 * `relief` drives the contour rail's profile: it is how much there is to
 * read at that station, so the rail's shape is a real elevation profile
 * of the page rather than a decorative squiggle. Deep case studies push
 * the contour out; short sections pull it in.
 */
export const sections = [
  { id: "position", label: "Position", station: "01", relief: 0.35 },
  { id: "scenes", label: "Scenes", station: "02", relief: 0.5 },
  { id: "scene-terramind", label: "TerraMind AI", station: "03", relief: 1 },
  { id: "scene-healthtrack", label: "HealthTrack", station: "04", relief: 0.8 },
  { id: "scene-stealth-friday", label: "Stealth F.R.I.D.A.Y", station: "05", relief: 0.7 },
  { id: "scene-ecoshare", label: "EcoShare", station: "06", relief: 0.6 },
  { id: "method", label: "Method", station: "07", relief: 0.45 },
  { id: "source", label: "Reading the code", station: "08", relief: 0.55 },
  { id: "instruments", label: "Instruments", station: "09", relief: 0.4 },
  { id: "traverse", label: "Traverse", station: "10", relief: 0.5 },
  { id: "contact", label: "Contact", station: "11", relief: 0.2 },
] as const;

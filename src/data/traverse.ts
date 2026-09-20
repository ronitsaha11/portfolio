import type { Station } from "./types";

/**
 * A traverse is a surveyed sequence of stations, each measured from the
 * last. Dated from commit history — nothing here is rounded or implied.
 */
export const traverse: Station[] = [
  {
    date: "Aug 2024",
    title: "First commit",
    detail: "GitHub account opened. Start of the public record.",
    depth: 0,
  },
  {
    date: "Nov 2024",
    title: "A static page",
    detail:
      "CARCRAFTERS — HTML, CSS and vanilla JavaScript. Worth keeping in the record because the distance from here is the point.",
    depth: 0,
  },
  {
    date: "Apr 2026",
    title: "First architected system",
    detail:
      "HealthTrack. The jump from pages to architecture: Clean Architecture, Hilt, Room, WorkManager, Health Connect, 174 files.",
    depth: 2,
  },
  {
    date: "May 2026",
    title: "Working inside a running system",
    detail:
      "Stealth F.R.I.D.A.Y — a live dashboard and automation layer built around an existing local agent core.",
    depth: 2,
  },
  {
    date: "Jul 2026",
    title: "A codebase with other people in it",
    detail:
      "EcoShare, deployed. Then the same domain rebuilt alone in Spring Boot, and the IBM Node.js and Express certification.",
    depth: 3,
  },
  {
    date: "Jul 2026",
    title: "TerraMind AI",
    detail:
      "Five days and 90 commits to the first cut, sole author; 116 now, with ruff, mypy and pytest gating every push since August. Specification-first and phase-tracked.",
    depth: 4,
  },
  {
    date: "Aug 2026",
    title: "This site",
    detail:
      "Built in public. Its own source is linked in the colophon, and the build fails if a number here loses its sample.",
    depth: 3,
  },
  {
    date: "Aug–Sep 2026",
    title: "Cartograph",
    detail:
      "Six milestones inside a Rust architecture engine someone else started: the desktop app, blast radius, structural diff, the GitHub reviewer, the MCP server and the AI boundary. The first codebase where the review was as much of the work as the code.",
    depth: 4,
  },
  {
    date: "Sep 2026",
    title: "PratiBimb",
    detail:
      "Smart India Hackathon, ISRO problem statement 26171. A two-person team with a frozen constitution, twenty-five security invariants and a spike protocol that pre-registers its accept criteria — including the one that invalidated our own test plan.",
    depth: 4,
  },
];

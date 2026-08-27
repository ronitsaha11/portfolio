import type { Scene } from "../types";

const REPO = "https://github.com/Somnath29/EcoShare";
const BLOB = `${REPO}/blob/main`;
const M = "2026-08-27";

export const ecoshare: Scene = {
  slug: "ecoshare",
  sceneNumber: 4,
  name: "EcoShare",
  subtitle: "Surplus food redistribution · team project",
  oneLiner:
    "Eight commits inside a three-person codebase: the surplus-food endpoints, the model and validators, the dashboard integration and the deploy config.",

  problem:
    "University kitchens throw away food that NGOs and students would take, and the gap is logistical rather than moral — surplus appears with a few hours of usable life, and whoever can collect it needs to know before it expires. The system has to model a listing that is time-bounded and claimable exactly once.",

  invariant:
    "A food listing can be reserved by exactly one party. Two NGOs must never both be told they have it.",

  approach:
    "This was a four-person build and my part was the server side of the listing flow. I wrote the food controller across five commits, the Food model with its shared types and request validators, and the NGO and kitchen paths through it — then the dashboard integration and the frontend API service that consumes it, and the Vercel routing config that got it deployed. It is the only project here where I worked inside someone else's codebase, which is the reason it is on the site at all.",

  hardPart: {
    title: "Working to someone else's conventions",
    body: "The interesting difficulty was not technical. The repository already had a shape — a controller layout, a validation approach, a response format — and the right move was to match it rather than improve it, because a codebase with two competing conventions is worse than one with a convention I would not have chosen. Where I did want a change, it was smaller and easier to justify: extracting request validation into a validator module rather than checking fields inline, which the rest of the team then used.",
  },

  limitation:
    "One of my commits added eight ad-hoc debugging scripts to the repository root that should have been cleaned up before pushing, and my commit messages here are well below the standard I set on TerraMind. Both are visible in the history and neither is defensible.",

  ownership:
    "Team project, 8 of 49 commits. The listing endpoints, Food model, validators, dashboard integration and deploy config are mine; the application as a whole is not.",

  stack: ["TypeScript", "Express", "MongoDB", "React", "JWT", "Vercel"],

  layers: [
    {
      id: "controller",
      name: "Food controller",
      role: "Mine. Listing, reservation and the NGO/kitchen paths, across five commits.",
      modules: ["backend/src/controllers/foodController.ts", "backend/src/routes/foodRoutes.ts"],
      depth: 3,
    },
    {
      id: "model",
      name: "Model and validation",
      role: "Mine. The Food model, shared types and request validators.",
      modules: ["backend/src/models/Food.ts", "backend/src/types/food.ts", "backend/src/validators/foodValidator.ts"],
      depth: 2,
    },
    {
      id: "client",
      name: "Dashboard",
      role: "Mine. The dashboard page and the frontend API service layer.",
      modules: ["frontend/src/pages/Dashboard.tsx", "frontend/src/services/api.ts"],
      depth: 1,
    },
    {
      id: "deploy",
      name: "Deployment",
      role: "Mine. SPA routing config that got the frontend live.",
      modules: ["frontend/vercel.json"],
      depth: 0,
    },
  ],

  readings: [
    {
      id: "es-commits",
      value: "8 / 49",
      label: "Commits · attributed",
      detail:
        "Eight of forty-nine commits are mine. The interval stays wide because the ownership genuinely is partial.",
      confidence: "attributed",
      samples: [
        { label: "My commits, filtered", href: `${REPO}/commits/main?author=ronitsaha11`, kind: "commit", measuredAt: M },
        { label: "Contributors", href: `${REPO}/graphs/contributors`, kind: "api", measuredAt: M },
      ],
    },
    {
      id: "es-controller",
      value: "5",
      label: "Commits · food controller",
      detail: "The listing and reservation endpoints, built up over five separate commits.",
      confidence: "measured",
      samples: [{ label: "foodController.ts", href: `${BLOB}/backend/src/controllers/foodController.ts`, kind: "code", measuredAt: M }],
    },
    {
      id: "es-deployed",
      value: "live",
      label: "Deployed · Vercel",
      detail: "The only project here that is publicly deployed.",
      confidence: "attributed",
      samples: [
        { label: "eco-share-smart-food-waste-manageme.vercel.app", href: "https://eco-share-smart-food-waste-manageme.vercel.app", kind: "deploy", measuredAt: M },
      ],
    },
  ],

  decisions: [
    {
      id: "es-adr-validators",
      title: "Validation as a module, not inline field checks",
      context:
        "Request validation was being written inline in each controller, so the same shape was checked slightly differently in two places.",
      options: [
        { option: "Leave it inline and match the existing style", rejected: true, reason: "The divergence was already producing different error responses for the same bad input." },
        { option: "Introduce a validation library", rejected: true, reason: "A dependency decision is not mine to make unilaterally on a shared codebase." },
        { option: "Extract a plain validator module", rejected: false, reason: "No new dependency, matches the existing structure, and the team adopted it." },
      ],
      decision: "foodValidator.ts holds the shape checks; controllers call it and return one error format.",
      consequence:
        "One place to change when the model changes. The smallest change that fixed the actual problem.",
    },
  ],

  links: [
    { label: "REPOSITORY", href: REPO },
    { label: "COMMITS", href: `${REPO}/commits/main?author=ronitsaha11` },
    { label: "LIVE", href: "https://eco-share-smart-food-waste-manageme.vercel.app" },
  ],

  year: "2026",
  confidence: "attributed",
};

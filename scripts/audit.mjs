/**
 * Lighthouse audit against a production build.
 * Run: node scripts/audit.mjs   (with `pnpm start` already serving :3000)
 */
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const URL = process.env.AUDIT_URL ?? "http://localhost:3000";

/**
 * Runs N passes and reports the median.
 *
 * A single Lighthouse pass on a laptop is extremely noisy — consecutive
 * runs of an unchanged build have varied by 18 points here. Acting on one
 * number leads to "optimisations" that are measurement error.
 */
const RUNS = Number(process.env.AUDIT_RUNS ?? 3);

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

const runs = [];
let lastLhr = null;

for (let i = 0; i < RUNS; i++) {
  const chrome = await launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const result = await lighthouse(
      URL,
      { port: chrome.port, output: "json", logLevel: "error" },
      undefined,
    );
    if (!result) throw new Error("lighthouse returned nothing");
    lastLhr = result.lhr;
    const c = result.lhr.categories;
    runs.push({
      perf: Math.round(c.performance.score * 100),
      a11y: Math.round(c.accessibility.score * 100),
      bp: Math.round(c["best-practices"].score * 100),
      seo: Math.round(c.seo.score * 100),
      tbt: result.lhr.audits["total-blocking-time"].numericValue,
      lcp: result.lhr.audits["largest-contentful-paint"].numericValue,
      fcp: result.lhr.audits["first-contentful-paint"].numericValue,
      cls: result.lhr.audits["cumulative-layout-shift"].numericValue,
    });
    process.stdout.write(`run ${i + 1}/${RUNS}: perf ${runs.at(-1).perf}\n`);
  } finally {
    // Chrome's temp dir is often still locked on Windows; the profile is
    // disposable, so a failed cleanup must not fail the audit.
    try {
      await chrome.kill();
    } catch {
      /* ignore */
    }
  }
}

console.log("\n=== LIGHTHOUSE (median of " + RUNS + ") ===");
console.log(`Performance     ${median(runs.map((r) => r.perf))}   [${runs.map((r) => r.perf).join(", ")}]`);
console.log(`Accessibility   ${median(runs.map((r) => r.a11y))}`);
console.log(`Best Practices  ${median(runs.map((r) => r.bp))}`);
console.log(`SEO             ${median(runs.map((r) => r.seo))}`);

console.log("\n=== METRICS (median) ===");
console.log(`FCP   ${(median(runs.map((r) => r.fcp)) / 1000).toFixed(2)} s`);
console.log(`LCP   ${(median(runs.map((r) => r.lcp)) / 1000).toFixed(2)} s`);
console.log(`TBT   ${Math.round(median(runs.map((r) => r.tbt)))} ms   [${runs.map((r) => Math.round(r.tbt)).join(", ")}]`);
console.log(`CLS   ${median(runs.map((r) => r.cls)).toFixed(3)}`);

if (lastLhr) {
  console.log("\n=== FAILING (last run) ===");
  let failures = 0;
  for (const [key, cat] of Object.entries(lastLhr.categories)) {
    for (const ref of cat.auditRefs) {
      const a = lastLhr.audits[ref.id];
      if (!a || a.score === null || a.score >= 0.9) continue;
      if (a.scoreDisplayMode === "notApplicable" || a.scoreDisplayMode === "informative") continue;
      failures++;
      console.log(`[${key}] ${a.id} — ${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`);
    }
  }
  if (failures === 0) console.log("none");
}

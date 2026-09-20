/**
 * Every evidence link, actually requested.
 *
 * WHY THIS EXISTS
 *
 * `assertReadings` fails the build if a reading has no ground sample,
 * and that gate has always held. It checks that a sample *exists* and
 * that its href is https — it has never checked that the href resolves.
 *
 * It does not, always. TerraMind's nine specification volumes were
 * linked at `tree/main/docs/living-earth/specifications`; the directory
 * was later removed from the default branch, and the site went on
 * rendering a "9" whose evidence had been a 404 for weeks. The number
 * was true. The link was not, and on a site whose entire argument is
 * that a figure without its artifact is worthless, that is the worse
 * failure.
 *
 * The lesson is in the fix as much as the check: evidence that must
 * survive is pinned to a commit, never to a branch. A branch is a
 * moving target and `tree/main/...` is a promise nobody is keeping.
 *
 * Run:  pnpm verify:links
 *       pnpm verify:links --quiet    only print failures
 */
import { build } from "esbuild";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Hosts that answer a bot with a non-200 and a human with the page.
 * Skipped rather than silently passed, and reported as skipped.
 */
const NO_BOTS = [/(^|\.)linkedin\.com$/];

const QUIET = process.argv.includes("--quiet");
const CONCURRENCY = 6;
const TIMEOUT_MS = 20_000;

/** Bundle the data layer so Node can import TypeScript with path-less imports. */
async function loadData() {
  const dir = await mkdtemp(join(tmpdir(), "gt-links-"));
  const outfile = join(dir, "data.mjs");

  await build({
    entryPoints: ["src/data/evidence.ts"],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    logLevel: "silent",
  });

  const mod = await import(pathToFileURL(outfile).href);
  await rm(dir, { recursive: true, force: true });
  return mod;
}

function skipped(url) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  return NO_BOTS.some((re) => re.test(host));
}

/**
 * HEAD first, GET on anything that is not a clean 200 — a number of
 * hosts, GitHub's raw endpoints among them, answer HEAD with a 403 and
 * GET with the file.
 */
async function check(url) {
  const attempt = async (method) => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: ac.signal,
        headers: { "user-agent": "ground-truth-link-verifier" },
      });
      return res.status;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const head = await attempt("HEAD");
    if (head === 200) return { ok: true, status: 200 };
    const get = await attempt("GET");
    return { ok: get === 200, status: get };
  } catch (err) {
    return { ok: false, status: err?.name === "AbortError" ? "timeout" : "network" };
  }
}

async function main() {
  const { evidenceLinks } = await loadData();

  /** @type {Map<string, string[]>} url → the places that cite it */
  const byUrl = new Map();
  for (const { href, where } of evidenceLinks()) {
    const list = byUrl.get(href) ?? [];
    list.push(where);
    byUrl.set(href, list);
  }

  const urls = [...byUrl.keys()].sort();
  const failures = [];
  let skippedCount = 0;
  let done = 0;

  const queue = [...urls];
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      if (skipped(url)) {
        skippedCount += 1;
        done += 1;
        continue;
      }
      const { ok, status } = await check(url);
      done += 1;
      if (!ok) failures.push({ url, status, where: byUrl.get(url) ?? [] });
      if (!QUIET) {
        process.stdout.write(
          `\r  ${String(done).padStart(3)} / ${urls.length}  ${failures.length} failing`,
        );
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (!QUIET) process.stdout.write("\n");

  console.log(
    `\n[ground-truth] ${urls.length} evidence links · ` +
      `${urls.length - failures.length - skippedCount} resolved · ` +
      `${skippedCount} skipped (bot-blocked host) · ${failures.length} failing`,
  );

  if (failures.length > 0) {
    console.error("\nDead evidence:\n");
    for (const f of failures) {
      console.error(`  ${String(f.status).padEnd(8)} ${f.url}`);
      for (const w of f.where) console.error(`           cited by ${w}`);
    }
    console.error(
      "\nA figure whose artifact does not resolve is not a measurement.\n" +
        "Fix the link, or pin it to the commit the artifact still exists in.\n",
    );
    process.exitCode = 1;
    return;
  }

  // Keep the README's own claim honest too.
  try {
    const readme = await readFile("README.md", "utf8");
    if (!readme.includes("verify:links")) {
      console.warn("[ground-truth] README does not mention the link gate.");
    }
  } catch {
    /* no README is not this script's problem */
  }
}

await main();

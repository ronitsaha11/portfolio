import type { MetadataRoute } from "next";
import { assertReadings } from "@/data/assert";
import { allReadings } from "@/data/registry";
import { site } from "@/data/site";

/**
 * The evidence gate runs here.
 *
 * sitemap.ts is evaluated on every production build, which makes it the
 * cheapest place to enforce the site's one editorial rule: a reading
 * with no ground sample throws, and the build fails.
 *
 * It is the first of two gates. This one proves a figure HAS an
 * artifact. `pnpm verify:links` proves the artifact still RESOLVES,
 * which is a different failure and needs the network, so it runs as its
 * own command rather than inside the build.
 *
 * One URL, deliberately. This is a single document; listing its
 * fragments as separate sitemap entries would claim a dozen pages that
 * do not exist and is the most common way a portfolio sitemap is wrong.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  assertReadings(allReadings, "site build");

  return [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

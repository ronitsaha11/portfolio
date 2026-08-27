import type { MetadataRoute } from "next";
import { assertReadings } from "@/data/assert";
import { allReadings } from "@/data/registry";
import { site } from "@/data/site";

/**
 * The evidence gate runs here.
 *
 * sitemap.ts is evaluated on every production build, which makes it the
 * cheapest place to enforce the site's one editorial rule: a reading with
 * no ground sample throws, and the build fails.
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

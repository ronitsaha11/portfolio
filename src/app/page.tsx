import { LatticeProvider } from "@/components/lattice/LatticeProvider";
import { LatticeMount } from "@/components/lattice/LatticeMount";
import { Reticle } from "@/components/chrome/Reticle";
import { SiteNav } from "@/components/layout/SiteNav";
import { ChapterRail } from "@/components/layout/ChapterRail";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Position } from "@/components/sections/Position";
import { SystemIndex } from "@/components/sections/SystemIndex";
import { SceneStage } from "@/components/scenes/SceneStage";
import { Method } from "@/components/sections/Method";
import { SourceReading } from "@/components/sections/SourceReading";
import { Instruments } from "@/components/sections/Instruments";
import { Traverse } from "@/components/sections/Traverse";
import { Contact } from "@/components/sections/Contact";
import { scenes } from "@/data/scenes";

/**
 * One continuous document, fourteen chapters, one 3D scene behind it.
 *
 * Everything inside LatticeProvider can register a chapter and ask
 * where the reader is; nothing inside it imports three.js. The canvas
 * is mounted once, after first paint, by LatticeMount — so the whole
 * page is readable and navigable before any WebGL exists, and stays
 * readable if none ever arrives.
 *
 * The content column carries `above-lattice`, which is the single
 * stacking context that puts every section in front of the canvas.
 * Declaring it once here is why no section needs a z-index of its own.
 */
export default function HomePage() {
  return (
    <LatticeProvider>
      <LatticeMount />
      <Reticle />
      <SiteNav />
      <ChapterRail />

      <main className="above-lattice px-[var(--spacing-page)] lg:pl-[calc(var(--spacing-rail)+var(--spacing-page))]">
        <Hero />
        <Position />
        <SystemIndex />

        {/* Six systems, each a pinned journey with its own act
            plan, its own camera and its own end matter. See
            SceneStage: one scroll range per scene drives the DOM and
            the 3D from the same number. */}
        {scenes.map((scene) => (
          <SceneStage key={scene.slug} scene={scene} />
        ))}

        <Method />
        <SourceReading />
        <Instruments />
        <Traverse />
        <Contact />
      </main>

      {/* Outside <main>, so the landmark structure is main + contentinfo. */}
      <div className="above-lattice px-[var(--spacing-page)] lg:pl-[calc(var(--spacing-rail)+var(--spacing-page))]">
        <Footer />
      </div>
    </LatticeProvider>
  );
}

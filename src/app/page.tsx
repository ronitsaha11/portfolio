import { Acquisition } from "@/components/boot/Acquisition";
import { Reticle } from "@/components/chrome/Reticle";
import { DepthFieldMount } from "@/components/chrome/DepthFieldMount";
import { SiteNav } from "@/components/layout/SiteNav";
import { ContourRail } from "@/components/layout/ContourRail";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Position } from "@/components/sections/Position";
import { SceneIndex } from "@/components/sections/SceneIndex";
import { SceneShell } from "@/components/scenes/SceneShell";
import { Method } from "@/components/sections/Method";
import { SourceReading } from "@/components/sections/SourceReading";
import { Instruments } from "@/components/sections/Instruments";
import { Traverse } from "@/components/sections/Traverse";
import { Contact } from "@/components/sections/Contact";
import { scenes } from "@/data/scenes";

export default function HomePage() {
  return (
    <>
      <Acquisition />
      <Reticle />
      {/* the 3D floor and ceiling the lower page sits inside */}
      <DepthFieldMount />
      <SiteNav />
      <ContourRail />

      {/* relative + z-10 so content stacks above the fixed depth field */}
      <main className="relative z-10 px-[var(--spacing-page)] lg:pl-[calc(var(--spacing-rail)+var(--spacing-page))]">
        <Hero />
        <Position />
        <SceneIndex />

        {scenes.map((scene) => (
          <SceneShell key={scene.slug} scene={scene} />
        ))}

        <Method />
        <SourceReading />
        <Instruments />
        <Traverse />
        <Contact />
      </main>

      {/* outside <main> so the landmark structure is main + contentinfo */}
      <div className="px-[var(--spacing-page)] lg:pl-[calc(var(--spacing-rail)+var(--spacing-page))]">
        <Footer />
      </div>
    </>
  );
}

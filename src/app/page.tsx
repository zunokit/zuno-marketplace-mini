import { HeroSection } from "@/components/common/sections/HeroSection";
import { FeatureGrid } from "@/components/common/sections/FeatureGrid";
import { CTASection } from "@/components/common/sections/CTASection";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeatureGrid />
      <CTASection />
    </main>
  );
}
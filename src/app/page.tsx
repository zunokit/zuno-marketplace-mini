"use client";

import { MainLayout } from "@/components/common/layout/MainLayout";
import { HeroSection } from "@/components/common/sections/HeroSection";

export default function HomePage() {
  return (
    <MainLayout>
      <div className="min-h-screen">
        <HeroSection />
      </div>
    </MainLayout>
  );
}
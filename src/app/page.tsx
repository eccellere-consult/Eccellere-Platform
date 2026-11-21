import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { ValueProposition } from "@/components/home/ValueProposition";
import { SectorFocus } from "@/components/home/SectorFocus";
import { MSMEStrip } from "@/components/home/MSMEStrip";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { FeaturedMarketplace } from "@/components/home/FeaturedMarketplace";
import { AIAssessmentCTA } from "@/components/home/AIAssessmentCTA";
import { ChatbotTeaser } from "@/components/home/ChatbotTeaser";
import { Perspectives } from "@/components/home/Perspectives";
import { Testimonials } from "@/components/home/Testimonials";
import { SpecialistCTA } from "@/components/home/SpecialistCTA";

// The official address of the home page, so Google treats www and non-www as one page.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <ValueProposition />
        <FeaturedMarketplace />
        <AIAssessmentCTA />
        <ChatbotTeaser />
        <SectorFocus />
        <FeaturedServices />
        <MSMEStrip />
        <Perspectives />
        <Testimonials />
        <SpecialistCTA />
      </main>
      <Footer />
    </>
  );
}

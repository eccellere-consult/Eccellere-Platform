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

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <ValueProposition />
        <SectorFocus />
        <MSMEStrip />
        <FeaturedServices />
        <FeaturedMarketplace />
        <AIAssessmentCTA />
        <ChatbotTeaser />
        <Perspectives />
        <Testimonials />
        <SpecialistCTA />
      </main>
      <Footer />
    </>
  );
}

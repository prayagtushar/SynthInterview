import Navbar from "../components/landing/Navbar";
import HeroOverlay from "../components/landing/HeroOverlay";
import FeaturesSection from "../components/landing/FeaturesSection";
import WorkflowSection from "../components/landing/WorkflowSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import UseCasesSection from "../components/landing/UseCasesSection";
import FAQSection from "../components/landing/FAQSection";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";

export default function HomePage() {
  return (
    <main className="bg-[#030303]">
      <Navbar />
      <HeroOverlay />
      <FeaturesSection />
      <WorkflowSection />
      <TestimonialsSection />
      <UseCasesSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}

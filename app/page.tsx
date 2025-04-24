import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { DemoSection } from "@/components/DemoSection";
import { ApiUsageSection } from "@/components/ApiUsageSection";
import { Footer } from "@/components/Footer";

const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center gap-8 p-4 md:p-8">
      <Header />
      <Hero />
      <DemoSection />
      <ApiUsageSection />
      <Footer />
    </div>
  );
};

export default HomePage;

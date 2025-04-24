import { Hero } from "@/components/Hero";
import { DemoSection } from "@/components/DemoSection";
import { ApiUsageSection } from "@/components/ApiUsageSection";

const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center gap-8 p-4 md:p-8">
      <Hero />
      <DemoSection />
      <ApiUsageSection />
    </div>
  );
};

export default HomePage;

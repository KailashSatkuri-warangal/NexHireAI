
import { Hero } from "@/components/landing/hero";
import { About } from "@/components/landing/about";
import { TheEvolution } from "@/components/landing/the-evolution";
import { Testimonials } from "@/components/landing/testimonials";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";


export default function HomePage() {
  return (
    <div className="bg-background">
      <Hero />
      <About />
      <TheEvolution />
      <Testimonials />
      <Cta />
      <Footer />
    </div>
  );
}

    
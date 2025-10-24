
import { Hero } from "@/components/landing/hero";
import { About } from "@/components/landing/about";
import { Testimonials } from "@/components/landing/testimonials";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";


export default function HomePage() {
  return (
    <div className="bg-background">
      <Hero />
      <About />
      <Testimonials />
      <Cta />
      <Footer />
    </div>
  );
}

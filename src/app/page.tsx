import { Hero } from "@/components/landing/hero";
import { About } from "@/components/landing/about";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  // The homepage is now a server component.
  // Role-based redirection is handled by the layout and auth provider,
  // so this page can focus solely on displaying the public content.
  return (
    <div className="bg-background">
      <Hero />
      <About />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Cta />
      <Footer />
    </div>
  );
}

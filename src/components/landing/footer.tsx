
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Twitter, Github, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  return (
    <footer className="bg-card/30 border-t border-border/50">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 space-y-4">
                <div className="flex items-center gap-2">
                    <Logo className="h-6 w-6" />
                    <span className="font-bold text-lg">NexHireAI</span>
                </div>
                <p className="text-sm text-muted-foreground">AI-powered skill assessments for the next generation of talent.</p>
                 <div className="flex gap-4 mt-4">
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                    <Twitter className="h-5 w-5" />
                    </Link>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                    <Github className="h-5 w-5" />
                    </Link>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                    <Linkedin className="h-5 w-5" />
                    </Link>
                </div>
            </div>
             <div className="col-span-1">
                <h4 className="font-semibold mb-3">Platform</h4>
                <nav className="flex flex-col gap-2">
                    <Link href="/#about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
                    <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link>
                    <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How it Works</Link>
                    <Link href="/skill-assessment" className="text-sm text-muted-foreground hover:text-foreground">Assessments</Link>
                </nav>
            </div>
             <div className="col-span-1">
                <h4 className="font-semibold mb-3">Legal</h4>
                <nav className="flex flex-col gap-2">
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
                    <Link href="/#contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
                </nav>
            </div>
             <div className="col-span-1 space-y-3">
                <h4 className="font-semibold">Stay Updated</h4>
                <p className="text-sm text-muted-foreground">Join our newsletter for the latest updates.</p>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input type="email" placeholder="Email" className="bg-background/70"/>
                    <Button type="submit" size="sm">Subscribe</Button>
                </div>
            </div>
        </div>
        <div className="mt-12 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} NexHireAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

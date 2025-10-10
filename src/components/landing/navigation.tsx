
import Link from 'next/link';

export function Navigation() {
  return (
    <nav className="hidden items-center gap-6 md:flex">
      <Link href="/#home" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        Home
      </Link>
      <Link href="/#about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        About
      </Link>
      <Link href="/#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        Features
      </Link>
      <Link href="/#contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        Contact
      </Link>
    </nav>
  );
}

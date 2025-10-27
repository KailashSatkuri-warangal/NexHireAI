
'use client';

import { Header } from '@/components/landing/header';
import { usePathname } from 'next/navigation';

export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminSection = pathname.startsWith('/admin');

  // If it's an admin route, the admin layout handles everything.
  // This creates a completely separate shell for the admin experience.
  if (isAdminSection) {
      return (
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
      )
  }

  // Otherwise, render the default public/candidate layout with its header.
  return (
      <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow flex">
            {children}
          </main>
      </div>
  )
}

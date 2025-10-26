
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is now obsolete and redirects to the new /admin route.
export default function OldAdminPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return null;
}

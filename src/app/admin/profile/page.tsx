
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfilePage from '@/app/profile/[id]/page';

export default function AdminProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);
  
  if(isLoading || !user) return null;

  // We can reuse the dynamic profile page component
  // It will automatically handle fetching the correct data for the logged-in admin/recruiter
  // by using the "me" parameter internally.
  return <ProfilePage />;
}


'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfilePage from '@/app/profile/[id]/page';
import { Loader2 } from 'lucide-react';

export default function AdminProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);
  
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // We can reuse the dynamic profile page component
  // It will automatically handle fetching the correct data for the logged-in admin/recruiter
  // by using the "me" parameter internally.
  return <ProfilePage />;
}

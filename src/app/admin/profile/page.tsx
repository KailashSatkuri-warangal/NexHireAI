
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfilePage from '@/app/profile/[id]/page';

// This component now correctly renders the generic profile page
// within the admin layout. The ProfilePage component is smart enough
// to figure out it needs to load the logged-in user's data.
export default function AdminProfilePage() {
  return <ProfilePage />;
}

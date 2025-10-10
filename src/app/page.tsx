"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/types';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = (role: UserRole) => {
    login(role);
    router.push('/dashboard');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-card/60 backdrop-blur-lg border-border/30">
        <CardHeader className="items-center text-center">
          <Logo className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-bold">Welcome to NexHireAI</CardTitle>
          <CardDescription>Sign in to continue to your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" defaultValue="demouser@nexhire.ai" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" defaultValue="password" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3">
             <Button onClick={() => handleLogin('candidate')}>
              Sign In as Candidate
            </Button>
            <Button variant="secondary" onClick={() => handleLogin('recruiter')}>
              Sign In as Recruiter
            </Button>
            <Button variant="outline" onClick={() => handleLogin('admin')}>
              Sign In as Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

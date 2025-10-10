
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // The AuthProvider will handle redirection now.
  // The useEffect for redirection is removed from here.

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login(email, password);
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      // The redirect will be handled by the AuthProvider's logic.
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
      setIsLoggingIn(false);
    }
  };

  // The AuthProvider shows a loading screen, so we don't need one here.

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
              <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoggingIn} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoggingIn} />
            </div>
          </div>
          <div className="mt-6">
             <Button onClick={handleLogin} className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

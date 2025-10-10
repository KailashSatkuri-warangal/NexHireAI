"use client";

import { useAuth } from "@/hooks/use-auth";
import CandidateView from "@/components/dashboard/candidate-view";
import RecruiterView from "@/components/dashboard/recruiter-view";
import AdminView from "@/components/dashboard/admin-view";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'candidate':
        return <CandidateView />;
      case 'recruiter':
        return <RecruiterView />;
      case 'admin':
        return <AdminView />;
      default:
        return <div>Invalid user role. Please contact support.</div>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground">Here's your overview for today.</p>
      </div>
      {renderDashboard()}
    </div>
  );
}

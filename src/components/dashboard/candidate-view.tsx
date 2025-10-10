
'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Zap, Target, BookOpen, Award } from "lucide-react";
import { SkillProficiencyChart } from "./charts";
import StatCard from "./stat-card";
import RecentAssessments from "./recent-assessments";
import { useAuth } from "@/hooks/use-auth";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getFirestore } from "firebase/firestore";
import type { Assessment, Skill } from "@/lib/types";

export default function CandidateView() {
  const { user } = useAuth();
  const firestore = getFirestore();

  const assessmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'assessments'), where('userId', '==', user.id));
  }, [firestore, user]);
  const { data: assessments, isLoading: assessmentsLoading } = useCollection<Assessment>(assessmentsQuery);

  const skillsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'skills'), where('userId', '==', user.id));
  }, [firestore, user]);
  const { data: skills, isLoading: skillsLoading } = useCollection<Skill>(skillsQuery);

  const stats = [
    { title: "Experience Points", value: user?.xp?.toString() || "0", icon: Star, color: "text-yellow-400" },
    { title: "Assessments Taken", value: assessments?.length.toString() || "0", icon: BookOpen, color: "text-purple-400" },
    { title: "Skill Mastery", value: "82%", icon: Target, color: "text-blue-400" }, // Mocked for now
    { title: "Current Level", value: "15", icon: Zap, color: "text-green-400" }, // Mocked for now
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />
          ))}
        </div>
        <RecentAssessments assessments={assessments || []} isLoading={assessmentsLoading} />
      </div>
      <div className="space-y-6">
        <Card className="bg-card/60 backdrop-blur-xl border-border/30">
          <CardHeader>
            <CardTitle>Skill Proficiency</CardTitle>
          </CardHeader>
          <CardContent>
            {skillsLoading ? <p>Loading skills...</p> : <SkillProficiencyChart data={skills || []} />}
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur-xl border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span>Badges & Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="border-yellow-500/50 text-yellow-400">React Pro</Badge>
              <Badge variant="secondary" className="border-blue-500/50 text-blue-400">TypeScript Ninja</Badge>
              <Badge variant="secondary" className="border-green-500/50 text-green-400">Backend Wizard</Badge>
              <Badge variant="secondary" className="border-purple-500/50 text-purple-400">Perfect Score</Badge>
              <Badge variant="secondary" className="border-red-500/50 text-red-400">5-Day Streak</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

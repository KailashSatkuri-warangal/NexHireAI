
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BarChart, CheckCircle, Award } from "lucide-react";
import StatCard from "./stat-card";
import { SkillDistributionChart } from "./charts";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getFirestore } from "firebase/firestore";
import type { Candidate, Skill } from "@/lib/types";
import Link from "next/link";

export default function RecruiterView() {
  const firestore = getFirestore();

  const candidatesQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'users'), where('role', '==', 'candidate'));
  }, [firestore]);
  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>(candidatesQuery);
  
  const skillsQuery = useMemoFirebase(() => {
    return collection(firestore, 'skills');
  }, [firestore]);
  const { data: skills, isLoading: skillsLoading } = useCollection<Skill>(skillsQuery);

  const skillDistribution = skills?.reduce((acc, skill) => {
    const existing = acc.find(s => s.name === skill.name);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: skill.name, count: 1 });
    }
    return acc;
  }, [] as { name: string, count: number }[]);


  const stats = [
    { title: "Candidates to Review", value: candidates?.length.toString() || "0", icon: Users, color: "text-blue-400" },
    { title: "Avg. Assessment Score", value: "87%", icon: BarChart, color: "text-purple-400" }, // Mocked
    { title: "Hired this Month", value: "3", icon: CheckCircle, color: "text-green-400" }, // Mocked
    { title: "Top Performer", value: "Dana Scully", icon: Award, color: "text-yellow-400" }, // Mocked
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-xl border-border/30">
          <CardHeader>
            <CardTitle>Top Candidates</CardTitle>
            <CardDescription>Candidates with the highest overall scores.</CardDescription>
          </CardHeader>
          <CardContent>
            {candidatesLoading ? <p>Loading candidates...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">XP</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates?.slice(0, 5).map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={candidate.avatarUrl} alt={candidate.displayName} />
                            <AvatarFallback>{candidate.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{candidate.displayName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell className="text-right font-mono">{candidate.xp}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View Profile</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur-xl border-border/30">
          <CardHeader>
            <CardTitle>Skill Distribution</CardTitle>
            <CardDescription>Frequency of top skills across all candidates.</CardDescription>
          </CardHeader>
          <CardContent>
            {skillsLoading ? <p>Loading skills...</p> : <SkillDistributionChart data={skillDistribution || []} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

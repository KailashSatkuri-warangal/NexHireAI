import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockRecruiterCandidates, mockSkillDistribution } from "@/lib/placeholder-data";
import { Users, BarChart, CheckCircle, Award } from "lucide-react";
import StatCard from "./stat-card";
import { SkillDistributionChart } from "./charts";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export default function RecruiterView() {
  const stats = [
    { title: "Candidates to Review", value: "12", icon: Users, color: "text-blue-400" },
    { title: "Avg. Assessment Score", value: "87%", icon: BarChart, color: "text-purple-400" },
    { title: "Hired this Month", value: "3", icon: CheckCircle, color: "text-green-400" },
    { title: "Top Performer", value: "Dana Scully", icon: Award, color: "text-yellow-400" },
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Applied Role</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecruiterCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
                          <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{candidate.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{candidate.role}</TableCell>
                    <TableCell className="text-right font-mono">{candidate.score}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View Profile</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur-xl border-border/30">
          <CardHeader>
            <CardTitle>Skill Distribution</CardTitle>
            <CardDescription>Frequency of top skills across all candidates.</CardDescription>
          </CardHeader>
          <CardContent>
            <SkillDistributionChart data={mockSkillDistribution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, BarChart, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import StatCard from "./stat-card";
import { SkillDistributionChart } from "./charts";
import { mockSkillDistribution } from "@/lib/placeholder-data";

export default function AdminView() {
    const stats = [
        { title: "Total Users", value: "1,254", icon: Users, color: "text-blue-400" },
        { title: "Total Assessments", value: "3,421", icon: FileText, color: "text-purple-400" },
        { title: "Completed Today", value: "42", icon: CheckCircle, color: "text-green-400" },
        { title: "Platform Avg. Score", value: "81%", icon: BarChart, color: "text-yellow-400" },
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
                    <CardTitle>Admin Control Panel</CardTitle>
                    <CardDescription>Quick access to administrative tasks.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                    <Link href="/admin/questions">
                        <Card className="hover:bg-primary/5 transition-colors">
                            <CardHeader className="flex-row items-center gap-4 space-y-0">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <Settings className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Manage Questions</CardTitle>
                                    <p className="text-sm text-muted-foreground">Add, edit, or retire questions.</p>
                                </div>
                                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
                            </CardHeader>
                        </Card>
                    </Link>
                    <Link href="/admin/users">
                        <Card className="hover:bg-primary/5 transition-colors">
                            <CardHeader className="flex-row items-center gap-4 space-y-0">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Manage Users</CardTitle>
                                    <p className="text-sm text-muted-foreground">View and manage all users.</p>
                                </div>
                                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
                            </CardHeader>
                        </Card>
                    </Link>
                </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-xl border-border/30">
                <CardHeader>
                    <CardTitle>Platform Skill Trends</CardTitle>
                    <CardDescription>Most common skills across the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SkillDistributionChart data={mockSkillDistribution} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

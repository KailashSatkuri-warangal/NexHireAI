'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { BarChart, Users, NotebookPen, Target, TrendingUp, Crown, Medal, Gem, ArrowRight, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Mock data based on the user's detailed specification
const growthData = [
    { month: 'Jan', Candidates: 25, Active: 15 },
    { month: 'Feb', Candidates: 40, Active: 25 },
    { month: 'Mar', Candidates: 35, Active: 28 },
    { month: 'Apr', Candidates: 60, Active: 45 },
    { month: 'May', Candidates: 80, Active: 60 },
    { month: 'Jun', Candidates: 75, Active: 65 },
];

const funnelData = [
    { stage: 'Applied', value: 500, color: 'hsl(var(--chart-1))' },
    { stage: 'Shortlisted', value: 150, color: 'hsl(var(--chart-2))' },
    { stage: 'Screened', value: 100, color: 'hsl(var(--chart-3))' },
    { stage: 'Interviewed', value: 50, color: 'hsl(var(--chart-4))' },
    { stage: 'Hired', value: 10, color: 'hsl(var(--chart-5))' },
]

const leaderboardData = [
    { name: "Samantha Lee", avatar: "https://i.pravatar.cc/150?img=1", role: "AI Engineer", score: 96, time: 42 },
    { name: "David Chen", avatar: "https://i.pravatar.cc/150?img=2", role: "Frontend Developer", score: 92, time: 35 },
    { name: "Priya Sharma", avatar: "https://i.pravatar.cc/150?img=3", role: "Cloud Architect", score: 89, time: 55 },
    { name: "Michael Rodriguez", avatar: "https://i.pravatar.cc/150?img=4", role: "Data Scientist", score: 85, time: 48 },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

export default function AnalyticsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Simulate data fetching
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);
    
    if(isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <motion.div 
            className="p-8 space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Key insights into your recruitment pipeline and platform performance.</p>
            </motion.div>

            <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <StatCard icon={<Users />} title="New Candidates" value="+120" change="+15.2% this month" />
                <StatCard icon={<NotebookPen />} title="Assessments Taken" value="452" change="+8.9% this month" />
                <StatCard icon={<Target />} title="Avg. Score" value="78%" change="-1.2% this month" changeType="negative" />
                <StatCard icon={<TrendingUp />} title="Hiring Rate" value="8.5%" change="+0.5% this month" />
            </motion.div>
            
            <motion.div 
                variants={containerVariants}
                className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            >
                <motion.div variants={itemVariants} className="lg:col-span-3">
                    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg h-full">
                        <CardHeader>
                            <CardTitle>Candidate Growth</CardTitle>
                            <CardDescription>Monthly new signups over the last 6 months.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] pl-0">
                           <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                                     <defs>
                                        <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--background) / 0.8)', 
                                            borderColor: 'hsl(var(--border))',
                                            backdropFilter: 'blur(4px)',
                                        }}
                                    />
                                    <Area type="monotone" dataKey="Candidates" strokeWidth={2} stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCandidates)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg h-full">
                        <CardHeader>
                            <CardTitle>Hiring Funnel</CardTitle>
                            <CardDescription>Conversion rates across stages.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {funnelData.map((item, index) => {
                                const prevValue = index > 0 ? funnelData[index - 1].value : item.value;
                                const percentage = (item.value / prevValue) * 100;
                                const conversion = index > 0 ? `(${(item.value / prevValue * 100).toFixed(1)}%)` : '';
                                return (
                                    <div key={item.stage} className="space-y-1">
                                        <div className="flex justify-between items-center text-sm font-medium">
                                            <span>{item.stage}</span>
                                            <span>{item.value} <span className="text-muted-foreground">{conversion}</span></span>
                                        </div>
                                        <Progress value={percentage} style={{'--progress-color': item.color} as any} className="[&>div]:bg-[--progress-color] h-2" />
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
            
            <motion.div variants={itemVariants}>
                <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                    <CardHeader>
                        <CardTitle>Candidate Leaderboard</CardTitle>
                        <CardDescription>Top performers in the latest "AI Engineer" assessment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {leaderboardData.map((candidate, index) => (
                                <div key={candidate.name} className="flex items-center gap-4 hover:bg-muted/50 p-2 rounded-lg">
                                    <div className="flex items-center gap-2 w-12">
                                        {getRankIcon(index)}
                                    </div>
                                    <Avatar>
                                        <AvatarImage src={candidate.avatar} />
                                        <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{candidate.name}</p>
                                        <p className="text-sm text-muted-foreground">{candidate.role}</p>
                                    </div>
                                    <div className="w-24 text-right">
                                        <p className="font-bold text-lg">{candidate.score}%</p>
                                        <p className="text-xs text-muted-foreground">{candidate.time} min</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => router.push('/admin/candidates')}>
                                        View Profile <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

const StatCard = ({ icon, title, value, change, changeType = 'positive' }: { icon: React.ReactNode, title: string, value: string, change: string, changeType?: 'positive' | 'negative' }) => (
    <motion.div variants={itemVariants}>
        <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className={`text-xs ${changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                    {change}
                </p>
            </CardContent>
        </Card>
    </motion.div>
);

const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="h-6 w-6 text-yellow-400" />;
    if (rank === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 2) return <Gem className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">{rank + 1}</span>;
};

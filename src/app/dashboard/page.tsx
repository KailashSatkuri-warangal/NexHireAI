
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, Query, getDoc, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trophy, BarChart, BrainCircuit, Check, Bot, BookOpen, Star } from 'lucide-react';
import type { AssessmentAttempt, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { firestore } = initializeFirebase();
  const [attempts, setAttempts] = useState<(AssessmentAttempt & { roleName?: string })[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user || !firestore) return;

    const attemptsQuery: Query = query(collection(firestore, 'users', user.id, 'assessments'), orderBy('submittedAt', 'desc'));
    
    const unsubscribe = onSnapshot(attemptsQuery, async (querySnapshot) => {
      const attemptsData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const attempt = { id: docSnapshot.id, ...docSnapshot.data() } as AssessmentAttempt;
        const roleDocRef = doc(firestore, 'roles', attempt.roleId);
        const roleDoc = await getDoc(roleDocRef);
        const roleName = roleDoc.exists() ? (roleDoc.data() as Role).name : 'Unknown Role';
        return { ...attempt, roleName };
      }));
      setAttempts(attemptsData);
      setIsFetching(false);
    }, (error) => {
      console.error("Error fetching assessment attempts:", error);
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, [user, firestore]);

  const latestAttempt = useMemo(() => attempts.length > 0 ? attempts[0] : null, [attempts]);
  const totalAssessments = attempts.length;
  const overallAccuracy = useMemo(() => {
    if (totalAssessments === 0) return 0;
    const totalScore = attempts.reduce((acc, attempt) => acc + (attempt.finalScore || 0), 0);
    return Math.round(totalScore / totalAssessments);
  }, [attempts, totalAssessments]);

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, },
  };

  if (isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-full w-full p-4 md:p-8">
       <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.1),rgba(255,255,255,0))]"></div>
      
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-8"
        >
          Welcome, {user?.name}
        </motion.h1>
        
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
            <motion.div variants={itemVariants}><InfoCard icon={<Check />} title="Assessments Taken" value={totalAssessments.toString()} /></motion.div>
            <motion.div variants={itemVariants}><InfoCard icon={<BarChart />} title="Overall Accuracy" value={`${overallAccuracy}%`} /></motion.div>
            <motion.div variants={itemVariants}><InfoCard icon={<Bot />} title="AI Job Matches" value="3" /></motion.div>
            <motion.div variants={itemVariants}><InfoCard icon={<BookOpen />} title="Active Learning" value="In Progress" /></motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
            {!latestAttempt ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg text-center p-8">
                        <CardHeader>
                            <CardTitle className="text-2xl">No Assessments Taken Yet</CardTitle>
                            <CardDescription>Your performance analytics will appear here once you complete an assessment.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => router.push('/skill-assessment')}>Take Your First Assessment</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div 
                  key="dashboard-content"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                      <LatestResultCard latestAttempt={latestAttempt} />
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <GamificationCard user={user} />
                    </motion.div>

                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}

const InfoCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) => (
    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const LatestResultCard = ({ latestAttempt }: { latestAttempt: AssessmentAttempt & { roleName?: string }}) => {
    const skillScoresData = useMemo(() => {
        if (!latestAttempt?.skillScores) return [];
        return Object.entries(latestAttempt.skillScores)
          .filter(([, score]) => typeof score === 'number')
          .map(([skill, score]) => ({
            subject: skill.charAt(0).toUpperCase() + skill.slice(1),
            A: score,
            fullMark: 100,
        }));
    }, [latestAttempt]);

    return (
        <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Latest Result: {latestAttempt.roleName}</span>
                    <span className="text-sm font-normal text-muted-foreground">{new Date(latestAttempt.submittedAt!).toLocaleDateString()}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillScoresData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

const GamificationCard = ({ user }: { user: any }) => {
    return (
        <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy /> Gamification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="font-medium">Experience Points</span>
                    <span className="font-bold text-primary">{user?.xp || 0} XP</span>
                </div>
                <div>
                    <h4 className="font-medium mb-2">Badges</h4>
                    <div className="flex flex-wrap gap-2">
                        {user?.badges?.length ? user.badges.map((b: string) => <Badge key={b} variant="secondary">{b}</Badge>) : <p className="text-sm text-muted-foreground">No badges yet.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

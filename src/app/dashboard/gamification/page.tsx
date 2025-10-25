
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const achievements = [
    { id: 'consistency-champion', name: 'Consistency Champion', description: 'Complete assessments for 3 days in a row.' },
    { id: 'accuracy-master', name: 'Accuracy Master', description: 'Score above 90% in any assessment.' },
    { id: 'ai-explorer', name: 'AI Explorer', description: 'Take your first AI-related assessment.' },
    { id: 'five-in-a-row', name: 'Five in a Row', description: 'Answer 5 questions correctly in a streak.' },
    { id: 'first-step', name: 'First Step', description: 'Complete your first assessment.' },
    { id: 'perfect-score', name: 'Perfectionist', description: 'Achieve a perfect 100% score.' },
];

export default function GamificationPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

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
        visible: { y: 0, opacity: 1 },
    };
    
    if (isLoading) {
        return (
          <div className="flex items-center justify-center h-full w-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }
    
    const xp = user?.xp || 0;
    const level = Math.floor(xp / 1000) + 1;
    const xpForNextLevel = 1000;
    const currentLevelXp = xp % 1000;
    const progressToNextLevel = (currentLevelXp / xpForNextLevel) * 100;
    
    return (
        <div className="relative min-h-full w-full p-4 md:p-8">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.1),rgba(255,255,255,0))]"></div>
            
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold mb-8 flex items-center gap-3"
            >
                <Trophy /> Gamification
            </motion.h1>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                <motion.div variants={itemVariants} className="lg:col-span-1">
                    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader>
                            <CardTitle>Your Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-base font-medium text-primary">Level {level}</span>
                                    <span className="text-sm font-medium text-muted-foreground">{xp} / {level * 1000} XP</span>
                                </div>
                                <Progress value={progressToNextLevel} />
                                <p className="text-xs text-muted-foreground text-center mt-2">{xpForNextLevel - currentLevelXp} XP to next level</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold">Your Badges</h3>
                                <div className="flex flex-wrap gap-2">
                                    {user?.badges?.length ? (
                                        user.badges.map((badge: string) => <Badge key={badge} variant="secondary" className="text-lg py-1 px-3">{badge}</Badge>)
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No badges earned yet. Keep going!</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="lg:col-span-2">
                     <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader>
                            <CardTitle>Achievements</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {achievements.map(ach => {
                                const isUnlocked = user?.badges?.includes(ach.name);
                                return (
                                <motion.div
                                    key={ach.id}
                                    className={`p-4 rounded-lg border flex items-center gap-4 transition-all ${isUnlocked ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-border/50 opacity-60'}`}
                                    whileHover={{ scale: 1.03 }}
                                >
                                    <div className={`p-3 rounded-full ${isUnlocked ? 'bg-primary/20' : 'bg-muted'}`}>
                                        <Trophy className={`h-6 w-6 ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{ach.name}</h4>
                                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                                    </div>
                                </motion.div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}

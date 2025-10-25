
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { AssessmentAttempt, Role, Question } from '@/lib/types';
import { Loader2, ArrowLeft, Download, BarChart, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function AssessmentResultPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { firestore } = initializeFirebase();
    const [attempt, setAttempt] = useState<(AssessmentAttempt & { roleName?: string, questionsWithAnswers?: Question[] }) | null>(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !firestore || !params.id) return;

        const fetchAttempt = async () => {
            setIsFetching(true);
            try {
                const attemptId = params.id as string;
                const attemptDocRef = doc(firestore, 'users', user.id, 'assessments', attemptId);
                const attemptDoc = await getDoc(attemptDocRef);

                if (!attemptDoc.exists()) {
                    // Handle not found
                    setAttempt(null);
                    setIsFetching(false);
                    return;
                }

                const attemptData = { id: attemptDoc.id, ...attemptDoc.data() } as AssessmentAttempt;
                
                // Fetch Role Name
                const roleDocRef = doc(firestore, 'roles', attemptData.roleId);
                const roleDoc = await getDoc(roleDocRef);
                const roleName = roleDoc.exists() ? (roleDoc.data() as Role).name : 'Unknown Role';

                // Fetch all questions for this role to show answers
                const questions: Question[] = [];
                const questionsSnapshot = await getDoc(doc(firestore, `roles/${attemptData.roleId}`));
                 if (questionsSnapshot.exists()) {
                     // This is a simplified fetch, a real app might need a subcollection query
                     const roleDataWithQuestions = questionsSnapshot.data() as any;
                     if(roleDataWithQuestions.questions) {
                        questions.push(...roleDataWithQuestions.questions);
                     }
                 }
                 
                // In a real app we'd query the 'questions' subcollection
                // For now, we assume questions might be on the attempt object or need fetching
                // This is a placeholder for a more robust fetching strategy
                const questionsWithAnswers = attemptData.responses.map(res => {
                    const question = (attemptData.questions || []).find(q => q.id === res.questionId) || { id: res.questionId, questionText: 'Question not found' };
                    return { ...question, ...res };
                }) as Question[];

                setAttempt({ ...attemptData, roleName, questionsWithAnswers });

            } catch (error) {
                console.error("Error fetching assessment result:", error);
            } finally {
                setIsFetching(false);
            }
        };

        fetchAttempt();
    }, [user, firestore, params.id]);

    const containerVariants = {
        hidden: { opacity: 1 },
        visible: { transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    if (isFetching || authLoading) {
        return (
          <div className="flex items-center justify-center h-full w-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        );
    }
    
    if (!attempt) {
        return (
             <div className="flex items-center justify-center h-full w-full">
                <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg text-center p-8">
                    <CardHeader>
                        <CardTitle>Assessment Not Found</CardTitle>
                        <CardDescription>We couldn't find the assessment result you're looking for.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/dashboard/assessments')}>Back to Assessments</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const skillScoresData = Object.entries(attempt.skillScores || {})
      .filter(([, score]) => typeof score === 'number')
      .map(([skill, score]) => ({
        subject: skill.charAt(0).toUpperCase() + skill.slice(1),
        A: score,
        fullMark: 100,
    }));
    
    const completionTime = attempt.submittedAt && attempt.startedAt
        ? Math.round((attempt.submittedAt - attempt.startedAt) / 1000 / 60)
        : 'N/A';

    return (
         <div className="relative min-h-full w-full p-4 md:p-8">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.1),rgba(255,255,255,0))]"></div>
            
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
                <div>
                     <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assessments
                    </Button>
                    <h1 className="text-4xl font-bold">{attempt.roleName} - Results</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download Report (PDF)</Button>
                </div>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoCard title="Final Score" value={`${Math.round(attempt.finalScore!)}%`} />
                    <InfoCard title="Completion Time" value={`${completionTime} mins`} />
                    <InfoCard title="Date" value={new Date(attempt.submittedAt!).toLocaleDateString()} />
                </motion.div>
                
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Card className="lg:col-span-3 bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart /> Skill-wise Performance</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillScoresData}>
                                    <PolarGrid stroke="hsl(var(--border))" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                     <Card className="lg:col-span-2 bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit /> AI Feedback</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {attempt.aiFeedback ? (
                                <>
                                    <p className="font-semibold text-muted-foreground">{attempt.aiFeedback.overall}</p>
                                    <Separator />
                                    <h4 className="font-bold">Suggestions:</h4>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        {attempt.aiFeedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </>
                            ) : <p>AI feedback is being generated or was not available.</p>}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Placeholder for Question-wise breakdown */}
                 <motion.div variants={itemVariants}>
                    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader><CardTitle>Question Breakdown</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-center p-8">Question-wise answer review will be available here soon.</p>
                        </CardContent>
                    </Card>
                 </motion.div>
            </motion.div>
         </div>
    );
}

const InfoCard = ({ title, value }: { title: string, value: string }) => (
    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg text-center p-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <p className="text-3xl font-bold mt-2">{value}</p>
    </Card>
)

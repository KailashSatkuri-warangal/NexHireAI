
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { AssessmentAttempt, Role, Question, UserResponse } from '@/lib/types';
import { Loader2, ArrowLeft, Download, BarChart, BrainCircuit, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CodeEditor } from '@/components/assessment/CodeEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AttemptWithDetails = AssessmentAttempt & {
    roleName?: string;
    questionsWithAnswers?: (Question & UserResponse)[];
};

export default function AssessmentResultPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { firestore } = initializeFirebase();
    
    const [allAttempts, setAllAttempts] = useState<AttemptWithDetails[]>([]);
    const [currentAttempt, setCurrentAttempt] = useState<AttemptWithDetails | null>(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !firestore || !params.id) return;

        const fetchAllAttempts = async () => {
            setIsFetching(true);
            try {
                const initialAttemptId = params.id as string;
                const initialAttemptDocRef = doc(firestore, 'users', user.id, 'assessments', initialAttemptId);
                const initialAttemptDoc = await getDoc(initialAttemptDocRef);

                if (!initialAttemptDoc.exists()) {
                    setAllAttempts([]);
                    setCurrentAttempt(null);
                    return;
                }
                
                const initialAttemptData = { id: initialAttemptDoc.id, ...initialAttemptDoc.data() } as AssessmentAttempt;
                if (!initialAttemptData.rootAssessmentId) {
                     // This should not happen with the new logic, but handle as a graceful fallback.
                    console.warn("Attempt is missing a `rootAssessmentId`. Displaying as a standalone result.");
                    const detailedAttempt = await getDetailedAttempt(initialAttemptData);
                    setAllAttempts([detailedAttempt]);
                    setCurrentAttempt(detailedAttempt);
                    return;
                }
                
                // Fetch all attempts related by rootAssessmentId
                const historyQuery = query(
                    collection(firestore, 'users', user.id, 'assessments'),
                    where('rootAssessmentId', '==', initialAttemptData.rootAssessmentId),
                    orderBy('submittedAt', 'asc')
                );
                
                const historySnapshot = await getDocs(historyQuery);
                const historicalAttempts = await Promise.all(
                    historySnapshot.docs.map(doc => getDetailedAttempt({ id: doc.id, ...doc.data() } as AssessmentAttempt))
                );

                setAllAttempts(historicalAttempts);
                const current = historicalAttempts.find(a => a.id === initialAttemptId) || historicalAttempts[historicalAttempts.length - 1];
                setCurrentAttempt(current);

            } catch (error) {
                console.error("Error fetching assessment result history:", error);
            } finally {
                setIsFetching(false);
            }
        };

        const getDetailedAttempt = async (attempt: AssessmentAttempt): Promise<AttemptWithDetails> => {
            const roleDocRef = doc(firestore, 'roles', attempt.roleId);
            const roleDoc = await getDoc(roleDocRef);
            const roleName = roleDoc.exists() ? (roleDoc.data() as Role).name : 'Unknown Role';

            let questionsWithAnswers: (Question & UserResponse)[] = [];
            if (attempt.responses && Array.isArray(attempt.responses)) {
                const questionIds = attempt.responses.map(res => res.questionId);
                let questionsFromDb: Question[] = [];
                
                if (questionIds.length > 0) {
                    for (let i = 0; i < questionIds.length; i += 30) {
                        const chunk = questionIds.slice(i, i + 30);
                        const qQuery = query(collection(firestore, 'questionBank'), where('__name__', 'in', chunk));
                        const questionsSnapshot = await getDocs(qQuery);
                        questionsFromDb.push(...questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
                    }
                }
                questionsWithAnswers = attempt.responses
                    .map(res => {
                        const question = questionsFromDb.find(q => q.id === res.questionId);
                        if (!question) return null;
                        return { ...question, ...res };
                    })
                    .filter(Boolean) as (Question & UserResponse)[];
            }
            return { ...attempt, roleName, questionsWithAnswers };
        };

        fetchAllAttempts();
    }, [user, firestore, params.id]);

    const handleAttemptChange = (id: string) => {
        const selected = allAttempts.find(a => a.id === id);
        if (selected) setCurrentAttempt(selected);
    };

    const containerVariants = { hidden: { opacity: 1 }, visible: { transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
    
    const progressData = allAttempts.map((att, index) => ({
        name: `Attempt ${index + 1}`,
        Score: Math.round(att.finalScore!),
    }));

    const firstAttempt = allAttempts[0];
    const latestAttempt = allAttempts[allAttempts.length - 1];

    const improvement = firstAttempt?.finalScore && latestAttempt?.finalScore
        ? Math.round(((latestAttempt.finalScore - firstAttempt.finalScore) / firstAttempt.finalScore) * 100)
        : 0;

    const radarData = [
        ...Object.entries(firstAttempt?.skillScores || {}).map(([skill, score]) => ({ subject: skill, first: score })),
        ...Object.entries(latestAttempt?.skillScores || {}).map(([skill, score]) => ({ subject: skill, latest: score })),
    ].reduce((acc, curr) => {
        const existing = acc.find(item => item.subject === curr.subject);
        if (existing) {
            Object.assign(existing, curr);
        } else {
            acc.push(curr);
        }
        return acc;
    }, [] as { subject: string, first?: number|string, latest?: number|string }[]);


    if (isFetching || authLoading) {
        return <div className="flex items-center justify-center h-full w-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!currentAttempt) {
        return <div className="flex items-center justify-center h-full w-full"><Card className="text-center p-8"><CardHeader><CardTitle>Assessment Not Found</CardTitle><CardDescription>We couldn't find the result you're looking for.</CardDescription></CardHeader><CardContent><Button onClick={() => router.back()}>Back</Button></CardContent></Card></div>;
    }

    return (
         <div className="relative min-h-full w-full p-4 md:p-8">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.1),rgba(255,255,255,0))]"></div>
            
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start mb-8">
                <div>
                     <Button variant="ghost" onClick={() => router.back()} className="mb-2"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                    <h1 className="text-4xl font-bold">{currentAttempt.roleName} - Results</h1>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {allAttempts.length > 1 && (
                        <Select onValueChange={handleAttemptChange} value={currentAttempt.id}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="View another attempt..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allAttempts.map((att, i) => (
                                    <SelectItem key={att.id} value={att.id}>
                                        Attempt {i+1} - {new Date(att.submittedAt!).toLocaleString()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download Report (PDF)</Button>
                </div>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                {allAttempts.length > 1 && (
                     <motion.div variants={itemVariants}>
                        <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                             <CardHeader><CardTitle className="flex items-center gap-2"><BarChart /> Progress Overview</CardTitle></CardHeader>
                             <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                 <div className="md:col-span-3 h-60">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={progressData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                            <Line type="monotone" dataKey="Score" stroke="hsl(var(--primary))" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                 </div>
                                 <div className="flex flex-col justify-center gap-4">
                                     <InfoCard title="Highest Score" value={`${Math.max(...allAttempts.map(a => a.finalScore || 0))}%`} />
                                     <InfoCard title="Improvement" value={`${improvement >= 0 ? '+' : ''}${improvement}%`} className={improvement >= 0 ? 'text-green-500' : 'text-red-500'} />
                                 </div>
                             </CardContent>
                        </Card>
                     </motion.div>
                )}

                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoCard title="Final Score" value={`${Math.round(currentAttempt.finalScore!)}%`} />
                    <InfoCard title="Completion Time" value={`${Math.round((currentAttempt.submittedAt! - currentAttempt.startedAt) / 1000 / 60)} mins`} />
                    <InfoCard title="Date" value={new Date(currentAttempt.submittedAt!).toLocaleDateString()} />
                </motion.div>
                
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Card className="lg:col-span-3 bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart /> Skill-wise Performance</CardTitle></CardHeader>
                        <CardContent className="h-[300px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="hsl(var(--border))" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    {allAttempts.length > 1 && <Radar name="First" dataKey="first" stroke="hsl(var(--muted))" fill="hsl(var(--muted))" fillOpacity={0.4} />}
                                    <Radar name="Latest" dataKey="latest" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                     <Card className="lg:col-span-2 bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit /> AI Feedback</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {currentAttempt.aiFeedback ? (
                                <>
                                    <p className="font-semibold text-muted-foreground">{currentAttempt.aiFeedback.overall}</p>
                                    <Separator />
                                    <h4 className="font-bold">Suggestions:</h4>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        {currentAttempt.aiFeedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </>
                            ) : <p>AI feedback is being generated or was not available.</p>}
                        </CardContent>
                    </Card>
                </motion.div>

                 <motion.div variants={itemVariants}>
                    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader><CardTitle>Question Breakdown</CardTitle></CardHeader>
                        <CardContent>
                           <div className="space-y-2">
                             {(currentAttempt.questionsWithAnswers || []).map((qa, index) => (
                                <Collapsible key={qa.id} className="border-b last:border-b-0">
                                    <CollapsibleTrigger className="w-full text-left py-4 flex justify-between items-center hover:bg-muted/30 px-2 rounded-md">
                                        <div className="flex items-center gap-4">
                                            {qa.isCorrect ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                            <span className="font-medium">Q{index + 1}: {qa.questionText}</span>
                                        </div>
                                        <Badge variant="outline">{qa.skill}</Badge>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="p-4 bg-background/50 rounded-b-md">
                                        {qa.type === 'mcq' && (
                                            <div className="space-y-2 text-sm">
                                                <p><strong>Your Answer:</strong> <span className={qa.isCorrect ? 'text-green-500' : 'text-red-500'}>{qa.answer || "No answer"}</span></p>
                                                {!qa.isCorrect && <p><strong>Correct Answer:</strong> {qa.correctAnswer}</p>}
                                            </div>
                                        )}
                                        {qa.type === 'short' && (
                                            <div className="space-y-2 text-sm">
                                                <p><strong>Your Answer:</strong></p>
                                                <pre className="p-2 bg-muted rounded-md whitespace-pre-wrap font-sans">{qa.answer || "No answer"}</pre>
                                                <p><strong>Correct Answer:</strong></p>
                                                <pre className="p-2 bg-muted rounded-md whitespace-pre-wrap font-sans">{qa.correctAnswer}</pre>
                                            </div>
                                        )}
                                        {qa.type === 'coding' && (
                                             <CodeEditor 
                                                question={qa}
                                                response={qa}
                                                onResponseChange={() => {}}
                                                isReadOnly={true}
                                            />
                                        )}
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                           </div>
                        </CardContent>
                    </Card>
                 </motion.div>
            </motion.div>
         </div>
    );
}

const InfoCard = ({ title, value, className }: { title: string, value: string, className?: string }) => (
    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg text-center p-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <p className={`text-3xl font-bold mt-2 ${className}`}>{value}</p>
    </Card>
)

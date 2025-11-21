
'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs, doc, writeBatch, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Cohort, User, AssessmentTemplate } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FolderKanban, Users, NotebookPen, Send, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function PipelinePage() {
    const { firestore } = initializeFirebase();
    const { user: adminUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    useEffect(() => {
        if (!firestore) return;

        const cohortsQuery = query(collection(firestore, 'cohorts'));
        const unsubscribeCohorts = onSnapshot(cohortsQuery, async (querySnapshot) => {
            const cohortsData: Cohort[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cohort));

            const populatedCohorts = await Promise.all(cohortsData.map(async (cohort) => {
                if (cohort.candidateIds && cohort.candidateIds.length > 0) {
                     try {
                        const usersRef = collection(firestore, 'users');
                        const q = query(usersRef, where('__name__', 'in', cohort.candidateIds));
                        const userDocs = await getDocs(q);
                        const users = userDocs.docs.map(d => ({ id: d.id, ...d.data() } as User));
                        return { ...cohort, candidates: users };
                    } catch (e) {
                        console.error("Error fetching users for cohort:", cohort.id, e);
                        // Return cohort without candidates if fetch fails
                        return { ...cohort, candidates: [] };
                    }
                }
                return { ...cohort, candidates: [] };
            }));

            setCohorts(populatedCohorts);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching cohorts:", error);
            setIsLoading(false);
        });

        const templatesQuery = query(collection(firestore, 'assessments'), where('status', '==', 'active'));
        const unsubscribeTemplates = onSnapshot(templatesQuery, (snapshot) => {
            setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssessmentTemplate)));
        });

        return () => {
            unsubscribeCohorts();
            unsubscribeTemplates();
        };
    }, [firestore]);

    const handleOpenDialog = (cohort: Cohort) => {
        setSelectedCohort(cohort);
        setIsDialogOpen(true);
    };

    const handleAssignAssessment = async () => {
        if (!selectedCohort || !selectedTemplateId || !firestore || !adminUser) return;

        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        if (!selectedTemplate) return;

        const batch = writeBatch(firestore);

        // 1. Update the cohort document
        const cohortRef = doc(firestore, 'cohorts', selectedCohort.id);
        batch.update(cohortRef, {
            assignedAssessmentId: selectedTemplateId,
            assignedAssessmentName: selectedTemplate.name,
            assessmentAssignedAt: Date.now(),
        });

        // 2. Create a notification for each candidate
        selectedCohort.candidateIds.forEach(candidateId => {
            const notificationRef = doc(collection(firestore, `users/${candidateId}/notifications`));
            batch.set(notificationRef, {
                title: 'New Assessment Assigned',
                message: `You have been invited to take the "${selectedTemplate.name}" assessment.`,
                link: '/skill-assessment',
                isRead: false,
                createdAt: Date.now(),
            });
        });

        try {
            await batch.commit();
            toast({ title: 'Assessment Assigned!', description: `"${selectedTemplate.name}" has been sent to the cohort.` });
        } catch (error) {
            console.error("Error assigning assessment:", error);
            toast({ title: 'Error', description: 'Failed to assign the assessment.', variant: 'destructive' });
        } finally {
            setIsDialogOpen(false);
            setSelectedCohort(null);
            setSelectedTemplateId('');
        }
    };
    
    const containerVariants = {
        hidden: { opacity: 1 },
        visible: { transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-8">Recruitment Pipeline</h1>
            {isLoading ? (
                <div className="flex items-center justify-center text-center text-muted-foreground h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : cohorts.length === 0 ? (
                <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                    <CardHeader>
                        <CardTitle>Recruitment Pipeline</CardTitle>
                        <CardDescription>
                            Create shortlists from the "Candidates" page to start your pipeline.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                        <FolderKanban className="h-16 w-16 mb-4" />
                        <p>No shortlists created yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {cohorts.map(cohort => (
                        <motion.div key={cohort.id} variants={itemVariants}>
                            <Card className="h-full flex flex-col bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                                <CardHeader>
                                    <CardTitle>{cohort.name}</CardTitle>
                                    <CardDescription>
                                        Created on {format(new Date(cohort.createdAt), 'PP')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                        <Users className="h-4 w-4" />
                                        <span>{cohort.candidateIds.length} candidate(s)</span>
                                    </div>
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {cohort.candidates?.slice(0, 5).map(c => (
                                            <Avatar key={c.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                                <AvatarImage src={c.avatarUrl} alt={c.name} />
                                                <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        ))}
                                        {cohort.candidates && cohort.candidates.length > 5 && (
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground text-xs ring-2 ring-background">
                                                +{cohort.candidates.length - 5}
                                            </div>
                                        )}
                                    </div>

                                    {cohort.assignedAssessmentId && (
                                        <div className="mt-4 p-3 bg-primary/10 rounded-md">
                                            <p className="text-sm font-semibold flex items-center gap-2"><NotebookPen className="h-4 w-4 text-primary" /> Assessment Assigned</p>
                                            <p className="text-xs text-muted-foreground">{cohort.assignedAssessmentName}</p>
                                        </div>
                                    )}

                                </CardContent>
                                <CardFooter>
                                    {cohort.assignedAssessmentId ? (
                                        <Button className="w-full" onClick={() => router.push(`/admin/pipeline/${cohort.id}`)}>
                                            <BarChart2 className="mr-2 h-4 w-4" /> View Leaderboard
                                        </Button>
                                    ) : (
                                        <Button className="w-full" onClick={() => handleOpenDialog(cohort)}>
                                            <Send className="mr-2 h-4 w-4" /> Assign Assessment
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Assessment to "{selectedCohort?.name}"</DialogTitle>
                        <DialogDescription>
                            Select an assessment template to send to all candidates in this cohort. They will be notified to take the test.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an assessment..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(template => (
                                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignAssessment} disabled={!selectedTemplateId}>
                            Confirm & Send
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

'use client';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, getDocs, query, addDoc, writeBatch } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { generateAssessmentTemplate } from '@/ai/flows/generate-assessment-template-flow';
import { v4 as uuidv4 } from 'uuid';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, ArrowLeft, Wand2, Save, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import type { Role, Question, AssessmentTemplate } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionPreview } from '@/components/assessment/QuestionPreview';
import { QuestionEditor } from '@/components/assessment/QuestionEditor';


const assessmentSchema = z.object({
    name: z.string().min(5, 'Name must be at least 5 characters'),
    roleId: z.string().min(1, 'Please select a role'),
    questionCount: z.number().min(5).max(50),
    duration: z.number().min(10).max(180),
    difficultyMix: z.object({
        easy: z.number(),
        medium: z.number(),
        hard: z.number(),
    }),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

type ViewState = 'config' | 'preview';

export default function NewAssessmentPage() {
    const { firestore } = initializeFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [view, setView] = useState<ViewState>('config');

    const [draftTemplate, setDraftTemplate] = useState<(AssessmentTemplate & { questions: Question[] }) | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [isEditingNew, setIsEditingNew] = useState(false);


    const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors, isValid } } = useForm<AssessmentFormData>({
        resolver: zodResolver(assessmentSchema),
        mode: 'onBlur',
        defaultValues: {
            questionCount: 30,
            duration: 60,
            difficultyMix: { easy: 40, medium: 40, hard: 20 },
        },
    });

    const questionCount = watch('questionCount');
    const duration = watch('duration');
    const difficultyMix = watch('difficultyMix');

    useEffect(() => {
        if (!firestore) return;
        const fetchRoles = async () => {
            setIsLoadingRoles(true);
            const q = query(collection(firestore, 'roles'));
            const querySnapshot = await getDocs(q);
            setRoles(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role)));
            setIsLoadingRoles(false);
        };
        fetchRoles();
    }, [firestore]);
    
    const onGenerate = (data: AssessmentFormData) => {
        setIsGenerating(true);
        const selectedRole = roles.find(r => r.id === data.roleId);
        if (!selectedRole) {
            toast({ title: "Error", description: "Selected role not found.", variant: "destructive" });
            setIsGenerating(false);
            return;
        }

        toast({ title: "Generating Assessment...", description: "AI is crafting questions based on your specifications. This can take a moment." });
        generateAssessmentTemplate({
            roleName: selectedRole.name,
            roleId: selectedRole.id,
            subSkills: selectedRole.subSkills,
            assessmentName: data.name,
            questionCount: data.questionCount,
            duration: data.duration,
            difficultyMix: data.difficultyMix,
        }).then((template) => {
            setDraftTemplate(template);
            setView('preview');
            toast({ title: "Draft Generated!", description: "Review the questions below before saving." });
        }).catch((error) => {
            console.error("Error generating assessment:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during generation.";
            toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
        }).finally(() => {
            setIsGenerating(false);
        });
    };

    const handleProceedToManual = () => {
        const data = getValues();
        const selectedRole = roles.find(r => r.id === data.roleId);
         if (!data.name || !data.roleId) {
            toast({ title: 'Missing Details', description: 'Please provide an Assessment Name and Target Role before proceeding.', variant: 'destructive' });
            return;
        }
        
        setDraftTemplate({
            id: uuidv4(),
            name: data.name,
            role: selectedRole!.name,
            roleId: data.roleId,
            duration: data.duration,
            skills: selectedRole!.subSkills,
            questionCount: 0,
            difficultyMix: { easy: 0, medium: 0, hard: 0 },
            questionIds: [],
            questions: [],
            status: 'draft',
            version: '1.0',
            createdBy: 'Admin', // Replace with actual admin user
            createdAt: Date.now(),
        });
        setView('preview');
    }

    const handleAddNewQuestion = () => {
        setIsEditingNew(true);
        setEditingQuestion({
            id: uuidv4(),
            questionText: '',
            type: 'mcq',
            difficulty: 'Medium',
            skill: '',
            tags: [],
            options: ['', '', '', ''],
            correctAnswer: '',
            testCases: [],
            starterCode: '',
            timeLimit: 60,
        });
    };
    
    const handleUpdateQuestion = (updatedQuestion: Question) => {
        if (!draftTemplate) return;
        
        const questionExists = draftTemplate.questions.some(q => q.id === updatedQuestion.id);

        const updatedQuestions = questionExists
            ? draftTemplate.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
            : [...draftTemplate.questions, updatedQuestion];
        
        setDraftTemplate({
            ...draftTemplate,
            questions: updatedQuestions,
            questionCount: updatedQuestions.length,
        });

        setEditingQuestion(null);
        setIsEditingNew(false);
        toast({ title: isEditingNew ? "Question Added" : "Question Updated", description: "The change has been saved to this draft." });
    };

    const handleDeleteQuestion = (questionId: string) => {
        if (!draftTemplate) return;
        setDraftTemplate({
            ...draftTemplate,
            questions: draftTemplate.questions.filter(q => q.id !== questionId),
            questionCount: draftTemplate.questionCount - 1,
        });
        toast({ title: "Question Removed", variant: 'destructive' });
    }

    const handleSave = async () => {
        if (!draftTemplate || !firestore) return;
        setIsSaving(true);
        try {
            const { questions, ...templateToSave } = draftTemplate;
            const finalTemplate = {
                ...templateToSave,
                questionIds: questions.map(q => q.id),
                questionCount: questions.length, // Ensure count is accurate
            };

            const batch = writeBatch(firestore);

            // 1. Add the main assessment template document
            const assessmentRef = doc(firestore, 'assessments', finalTemplate.id);
            batch.set(assessmentRef, finalTemplate);
            
            // 2. Add all questions to the questionBank collection
            for (const question of questions) {
                const questionRef = doc(firestore, 'questionBank', question.id);
                batch.set(questionRef, question);
            }
            
            await batch.commit();

            toast({ title: "Assessment Created!", description: `${draftTemplate.name} has been added to the templates.` });
            router.push('/admin/assessments');
        } catch(error) {
            console.error("Error saving assessment:", error);
            toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    const handleSliderChange = (values: number[]) => {
        const [easy, medium] = values;
        setValue('difficultyMix', {
            easy: easy,
            medium: medium - easy,
            hard: 100 - medium,
        });
    };
    
    const currentTitle = view === 'preview' ? `Reviewing: "${draftTemplate?.name}"` : 'Create New Assessment Template';

    return (
        <div className="p-8">
            <Button variant="ghost" onClick={() => view === 'config' ? router.back() : setView('config')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to {view === 'config' ? 'Assessments' : 'Configuration'}
            </Button>
            <h1 className="text-4xl font-bold mb-2">{currentTitle}</h1>
            <p className="text-muted-foreground mb-8">Define parameters and questions for a new assessment.</p>
            
             <AnimatePresence mode="wait">
                {view === 'config' && (
                     <motion.div
                        key="config"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <form>
                            <Card className="max-w-4xl mx-auto bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                                <CardHeader>
                                    <CardTitle>1. Configure Your Assessment</CardTitle>
                                    <CardDescription>Set the high-level details. You can generate questions with AI or add them manually in the next step.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Assessment Name</Label>
                                            <Input id="name" {...register('name')} placeholder="e.g., Senior Frontend Developer Screening" />
                                            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="roleId">Target Role</Label>
                                            <Controller
                                                name="roleId"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger disabled={isLoadingRoles}>
                                                            <SelectValue placeholder="Select a role..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {isLoadingRoles ? (
                                                                <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                                                            ) : (
                                                                roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.roleId && <p className="text-red-500 text-sm">{errors.roleId.message}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                        <div className="space-y-2">
                                            <Label htmlFor="questionCount">Number of Questions (for AI generation)</Label>
                                            <Controller name="questionCount" control={control} render={({ field: { onChange, value } }) => (
                                                <Slider onValueChange={(v) => onChange(v[0])} value={[value]} min={5} max={50} step={1} />
                                            )}/>
                                            <p className="text-xs text-muted-foreground text-center">{questionCount} questions</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="duration">Duration (minutes)</Label>
                                            <Input id="duration" type="number" {...register('duration', { valueAsNumber: true })} />
                                            {errors.duration && <p className="text-red-500 text-sm">{errors.duration.message}</p>}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Difficulty Mix (for AI generation)</Label>
                                        <Controller name="difficultyMix" control={control} render={({ field }) => (
                                            <>
                                                <Slider
                                                    value={[field.value.easy, field.value.easy + field.value.medium]}
                                                    onValueChange={handleSliderChange}
                                                    min={0} max={100} step={5}
                                                    className="mt-4"
                                                />
                                                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                                    <span style={{ color: '#22c55e' }}>Easy: {difficultyMix.easy}%</span>
                                                    <span style={{ color: '#f97316' }}>Medium: {difficultyMix.medium}%</span>
                                                    <span style={{ color: '#ef4444' }}>Hard: {difficultyMix.hard}%</span>
                                                </div>
                                            </>
                                        )}/>
                                    </div>

                                </CardContent>
                                <CardFooter className="flex justify-between">
                                     <Button type="button" variant="secondary" onClick={handleProceedToManual} disabled={!isValid}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Create Manually
                                    </Button>
                                    <Button type="button" onClick={handleSubmit(onGenerate)} disabled={isGenerating || !isValid}>
                                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </motion.div>
                )}
                
                 {view === 'preview' && draftTemplate && (
                     <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                     >
                        <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                            <CardHeader>
                                <CardTitle>2. Review & Edit Questions</CardTitle>
                                <CardDescription>
                                    Review, edit, add, or remove questions below. You have added {draftTemplate.questions.length} questions so far.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto p-4 border rounded-md">
                                 {draftTemplate.questions.length > 0 ? (
                                    draftTemplate.questions.map((q, i) => (
                                        <div key={q.id} className="flex items-start gap-2">
                                            <QuestionPreview 
                                                question={q} 
                                                index={i} 
                                                onEdit={() => setEditingQuestion(q)} 
                                            />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" className="mt-1 flex-shrink-0">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will remove the question from this draft. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteQuestion(q.id)}>
                                                            Confirm
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    ))
                                 ) : (
                                    <div className="text-center text-muted-foreground p-8">No questions added yet.</div>
                                 )}

                                <Button variant="outline" className="w-full border-dashed mt-4" onClick={handleAddNewQuestion}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Question
                                </Button>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center mt-4">
                                <Button variant="ghost" onClick={() => setView('config')}>Back to Config</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button disabled={isSaving || draftTemplate.questions.length === 0}>
                                            <Save className="mr-2 h-4 w-4" /> Save Template
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Save</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will create a new assessment template with {draftTemplate.questions.length} questions.
                                                Are you sure you want to save?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleSave} disabled={isSaving}>
                                                 {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                 Confirm & Save
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <QuestionEditor 
                question={editingQuestion}
                onSave={handleUpdateQuestion}
                onClose={() => setEditingQuestion(null)}
            />
        </div>
    );
}

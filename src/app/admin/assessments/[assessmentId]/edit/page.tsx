
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc, updateDoc, collection, getDocs, query, writeBatch, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, ArrowLeft, Save, Trash2, Pencil } from 'lucide-react';
import type { Role, AssessmentTemplate, Question } from '@/lib/types';
import { QuestionPreview } from '@/components/assessment/QuestionPreview';
import { QuestionEditor } from '@/components/assessment/QuestionEditor';
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

const assessmentSchema = z.object({
    name: z.string().min(5, 'Name must be at least 5 characters'),
    roleId: z.string().min(1, 'Please select a role'),
    questionCount: z.number().min(1, 'There must be at least one question').max(50),
    duration: z.number().min(10).max(180),
    difficultyMix: z.object({
        easy: z.number(),
        medium: z.number(),
        hard: z.number(),
    }),
    status: z.enum(['active', 'draft']),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

export default function EditAssessmentPage() {
  const { firestore } = initializeFirebase();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draftTemplate, setDraftTemplate] = useState<(AssessmentTemplate & { questions: Question[] }) | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const assessmentId = params.assessmentId as string;

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
  });
  
  const difficultyMix = watch('difficultyMix');

  useEffect(() => {
    if (!firestore || !assessmentId) return;

    const fetchRolesAndAssessment = async () => {
        setIsLoading(true);
        try {
            // Fetch roles
            const rolesQuery = query(collection(firestore, 'roles'));
            const rolesSnapshot = await getDocs(rolesQuery);
            const rolesData = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
            setRoles(rolesData);
            
            // Fetch assessment template
            const assessmentRef = doc(firestore, 'assessments', assessmentId);
            const assessmentSnap = await getDoc(assessmentRef);
            
            if (assessmentSnap.exists()) {
                const templateData = assessmentSnap.data() as AssessmentTemplate;
                
                // Fetch associated questions in batches of 30 (Firestore 'in' query limit)
                let questions: Question[] = [];
                const questionIds = templateData.questionIds || [];
                if (questionIds.length > 0) {
                    for (let i = 0; i < questionIds.length; i += 30) {
                        const chunk = questionIds.slice(i, i + 30);
                        const questionsQuery = query(collection(firestore, 'questionBank'), where('__name__', 'in', chunk));
                        const questionsSnap = await getDocs(questionsQuery);
                        const questionsChunk = questionsSnap.docs.map(d => ({id: d.id, ...d.data()} as Question));
                        questions.push(...questionsChunk);
                    }
                }
                
                // Order questions according to the template's questionIds array
                const orderedQuestions = templateData.questionIds.map(id => questions.find(q => q.id === id)).filter(Boolean) as Question[];

                const fullTemplateData = { ...templateData, questions: orderedQuestions };
                setDraftTemplate(fullTemplateData);

                // Find roleId for the given role name to set default value correctly
                const roleId = rolesData.find(r => r.name === templateData.role)?.id || '';
                reset({ ...templateData, roleId, questionCount: fullTemplateData.questions.length });
            } else {
                toast({ title: "Assessment not found", variant: "destructive" });
                router.push('/admin/assessments');
            }
        } catch (error) {
            console.error("Error fetching data: ", error);
            toast({ title: "Error", description: "Failed to fetch necessary data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    fetchRolesAndAssessment();
  }, [firestore, assessmentId, reset, router, toast]);

  const onSave = async (data: AssessmentFormData) => {
    if (!firestore || !draftTemplate) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(firestore);
      const assessmentRef = doc(firestore, 'assessments', assessmentId);
      const selectedRole = roles.find(r => r.id === data.roleId);

      // Create a plain object for Firestore update
      const { ...formData } = data;
      
      // 1. Update the main assessment template document
      const templateToUpdate = {
        ...formData,
        role: selectedRole?.name || '',
        questionIds: draftTemplate.questions.map(q => q.id),
        questionCount: draftTemplate.questions.length, // Recalculate count
      };
      batch.update(assessmentRef, templateToUpdate);

      // 2. Update all questions in the questionBank
      for (const question of draftTemplate.questions) {
        const questionRef = doc(firestore, 'questionBank', question.id);
        const { id, ...questionData } = question;
        batch.set(questionRef, questionData); // Use set to either create new or update existing
      }
      
      await batch.commit();

      toast({ title: "Assessment Updated!", description: `${data.name} has been saved.` });
      router.push('/admin/assessments');
    } catch (error) {
      console.error("Error updating assessment:", error);
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
      if (!draftTemplate) return;
      const updatedQuestions = draftTemplate.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q);
      setDraftTemplate({...draftTemplate, questions: updatedQuestions });
      setEditingQuestion(null);
      toast({ title: "Question Updated", description: "The change has been saved to this draft." });
  };

  const handleDeleteQuestion = (questionId: string) => {
      if (!draftTemplate) return;
      const updatedQuestions = draftTemplate.questions.filter(q => q.id !== questionId);
      setDraftTemplate({...draftTemplate, questions: updatedQuestions });
      setValue('questionCount', updatedQuestions.length); // Update form state
      toast({ title: "Question Removed", variant: 'destructive' });
  };

  const handleSliderChange = (values: number[]) => {
    const [easy, medium] = values;
    setValue('difficultyMix', {
        easy: easy,
        medium: medium - easy,
        hard: 100 - medium,
    });
  };

  if (isLoading || !draftTemplate) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assessments
      </Button>
      <h1 className="text-4xl font-bold mb-2">Edit Assessment Template</h1>
      <p className="text-muted-foreground mb-8">Modify the parameters and questions for this assessment.</p>
      
      <form onSubmit={handleSubmit(onSave)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <Card className="sticky top-24 bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                <CardHeader>
                  <CardTitle>Assessment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                      <Label htmlFor="name">Assessment Name</Label>
                      <Input id="name" {...register('name')} />
                      {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="roleId">Target Role</Label>
                          <Controller
                              name="roleId"
                              control={control}
                              render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value} disabled={roles.length === 0}>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Select a role..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              )}
                          />
                          {errors.roleId && <p className="text-red-500 text-sm">{errors.roleId.message}</p>}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Controller
                              name="status"
                              control={control}
                              render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="active">Active</SelectItem>
                                          <SelectItem value="draft">Draft</SelectItem>
                                      </SelectContent>
                                  </Select>
                              )}
                          />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Question Count</Label>
                          <Input value={draftTemplate.questions.length} readOnly disabled />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="duration">Duration (minutes)</Label>
                          <Input id="duration" type="number" {...register('duration', { valueAsNumber: true })} />
                          {errors.duration && <p className="text-red-500 text-sm">{errors.duration.message}</p>}
                      </div>
                  </div>
                  <div className="space-y-2">
                      <Label>Difficulty Mix</Label>
                      <Controller name="difficultyMix" control={control} render={({ field }) => (
                          <>
                              <Slider
                                  value={field.value ? [field.value.easy, field.value.easy + field.value.medium] : [40, 80]}
                                  onValueChange={handleSliderChange}
                                  min={0} max={100} step={5}
                                  className="mt-4"
                              />
                              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                  <span style={{ color: '#22c55e' }}>Easy: {difficultyMix?.easy || 0}%</span>
                                  <span style={{ color: '#f97316' }}>Medium: {difficultyMix?.medium || 0}%</span>
                                  <span style={{ color: '#ef4444' }}>Hard: {difficultyMix?.hard || 0}%</span>
                              </div>
                          </>
                      )}/>
                  </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSaving} className="w-full">
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
              </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Review and edit the questions for this template.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                                    <Button variant="destructive" size="icon" className="mt-1">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will remove the question from this assessment template. This action cannot be undone.
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
                      <p className="text-muted-foreground text-center py-8">No questions found for this template.</p>
                  )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
      <QuestionEditor 
          question={editingQuestion}
          onSave={handleUpdateQuestion}
          onClose={() => setEditingQuestion(null)}
      />
    </div>
  );
}

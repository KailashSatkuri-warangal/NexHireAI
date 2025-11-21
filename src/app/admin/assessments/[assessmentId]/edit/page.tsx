
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc, updateDoc, collection, getDocs, query } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import type { Role, AssessmentTemplate } from '@/lib/types';

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

  const assessmentId = params.assessmentId as string;

  const { register, handleSubmit, control, watch, setValue, reset } = useForm<AssessmentFormData>({
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
            
            // Fetch assessment
            const assessmentRef = doc(firestore, 'assessments', assessmentId);
            const assessmentSnap = await getDoc(assessmentRef);
            
            if (assessmentSnap.exists()) {
                const data = assessmentSnap.data() as AssessmentTemplate;
                // Find roleId for the given role name to set default value correctly
                const roleId = rolesData.find(r => r.name === data.role)?.id || '';
                reset({ ...data, roleId });
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
    if (!firestore) return;
    setIsSaving(true);
    try {
      const assessmentRef = doc(firestore, 'assessments', assessmentId);
      const selectedRole = roles.find(r => r.id === data.roleId);
      
      const dataToSave = {
        ...data,
        role: selectedRole?.name || '', // Save role name along with other data
      };

      await updateDoc(assessmentRef, dataToSave);
      toast({ title: "Assessment Updated!", description: `${data.name} has been saved.` });
      router.push('/admin/assessments');
    } catch (error) {
      console.error("Error updating assessment:", error);
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSliderChange = (values: number[]) => {
    const [easy, medium] = values;
    setValue('difficultyMix', {
        easy: easy,
        medium: medium - easy,
        hard: 100 - medium,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assessments
      </Button>
      <h1 className="text-4xl font-bold mb-2">Edit Assessment Template</h1>
      <p className="text-muted-foreground mb-8">Modify the parameters for this assessment.</p>
      
      <form onSubmit={handleSubmit(onSave)}>
        <Card className="max-w-2xl mx-auto bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <Label htmlFor="name">Assessment Name</Label>
                <Input id="name" {...register('name')} />
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
                    <Label htmlFor="questionCount">Question Count</Label>
                    <Input id="questionCount" type="number" {...register('questionCount', { valueAsNumber: true })} readOnly disabled />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input id="duration" type="number" {...register('duration', { valueAsNumber: true })} />
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
            <p className="text-sm text-muted-foreground pt-4 border-t">Note: Editing individual questions within a saved template is not supported in this version.</p>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

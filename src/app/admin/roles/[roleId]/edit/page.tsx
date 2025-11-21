
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Save, PlusCircle, X, Trash2 } from 'lucide-react';
import type { Role } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const roleSchema = z.object({
  name: z.string().min(3, 'Role name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  subSkills: z.array(z.string().min(1, 'Skill cannot be empty')).min(1, 'At least one sub-skill is required'),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function EditRolePage() {
  const { firestore } = initializeFirebase();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const roleId = params.roleId as string;

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subSkills",
  });

  useEffect(() => {
    if (!firestore || !roleId) return;
    
    const fetchRole = async () => {
        setIsLoading(true);
        const roleRef = doc(firestore, 'roles', roleId);
        const roleSnap = await getDoc(roleRef);
        if (roleSnap.exists()) {
            reset(roleSnap.data() as RoleFormData);
        } else {
            toast({ title: "Role not found", variant: "destructive" });
            router.push('/admin/roles');
        }
        setIsLoading(false);
    };

    fetchRole();
  }, [firestore, roleId, reset, router, toast]);

  const onSave = async (data: RoleFormData) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const roleRef = doc(firestore, 'roles', roleId);
      await updateDoc(roleRef, data);
      toast({ title: "Role Updated!", description: `${data.name} has been saved.` });
      router.push('/admin/roles');
    } catch (error) {
      console.error("Error updating role:", error);
      toast({ title: "Save Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(firestore, 'roles', roleId));
        toast({ title: "Role Deleted", description: "The role has been permanently removed." });
        router.push('/admin/roles');
    } catch (error) {
         console.error("Error deleting role:", error);
        toast({ title: "Delete Failed", description: (error as Error).message, variant: "destructive" });
        setIsDeleting(false);
        setDialogOpen(false);
    }
  }
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roles
      </Button>
      <h1 className="text-4xl font-bold mb-2">Edit Role</h1>
      <p className="text-muted-foreground mb-8">Modify the professional role and its required skills.</p>
      
      <form onSubmit={handleSubmit(onSave)}>
        <Card className="max-w-2xl mx-auto bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Sub-skills</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`subSkills.${index}`)} placeholder={`Skill ${index + 1}`} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.subSkills && <p className="text-red-500 text-sm">{errors.subSkills.message || errors.subSkills.root?.message}</p>}

              <Button type="button" variant="outline" size="sm" onClick={() => append('')} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Role'}
            </Button>
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                 <Button type="button" variant="destructive" onClick={() => setDialogOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                </Button>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this role.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                             {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Yes, delete it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

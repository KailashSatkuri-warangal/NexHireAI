
'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { User } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, ListPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function CandidatesPage() {
    const { firestore } = initializeFirebase();
    const { user: adminUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [candidates, setCandidates] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
    const [shortlistName, setShortlistName] = useState('');

    useEffect(() => {
        if (!firestore) return;

        const fetchCandidates = async () => {
            setIsLoading(true);
            try {
                const candidatesQuery = query(collection(firestore, 'users'), where('role', '==', 'candidate'));
                const querySnapshot = await getDocs(candidatesQuery);
                const candidatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
                setCandidates(candidatesData);
            } catch (error) {
                console.error("Error fetching candidates:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCandidates();
    }, [firestore]);

    const handleSelectCandidate = (candidateId: string) => {
        setSelectedCandidates(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(candidateId)) {
                newSelection.delete(candidateId);
            } else {
                newSelection.add(candidateId);
            }
            return newSelection;
        });
    };

    const handleCreateShortlist = async () => {
        if (!adminUser || !firestore) return;
        if (shortlistName.trim() === '') {
            toast({ title: "Name required", description: "Please enter a name for your shortlist.", variant: "destructive" });
            return;
        }

        try {
            await addDoc(collection(firestore, 'cohorts'), {
                name: shortlistName,
                candidateIds: Array.from(selectedCandidates),
                createdBy: adminUser.id,
                createdAt: Date.now(),
            });
            toast({ title: "Shortlist Created!", description: `Cohort "${shortlistName}" has been created.` });
            setSelectedCandidates(new Set());
            setShortlistName('');
            router.push('/admin/pipeline');
        } catch (error) {
            console.error("Error creating cohort:", error);
            toast({ title: "Error", description: "Could not create the shortlist.", variant: "destructive" });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    const isAnyCandidateSelected = selectedCandidates.size > 0;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Candidate Management</h1>
                {isAnyCandidateSelected && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button>
                                <ListPlus className="mr-2 h-4 w-4" />
                                Create Shortlist ({selectedCandidates.size})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Create New Shortlist</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You are creating a new cohort with {selectedCandidates.size} selected candidate(s). Give this shortlist a name to track it in your pipeline.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                             <Input 
                                placeholder="e.g., Senior Frontend - Q3 2024"
                                value={shortlistName}
                                onChange={(e) => setShortlistName(e.target.value)}
                            />
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCreateShortlist}>Create</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                <CardHeader>
                    <CardTitle>All Candidates</CardTitle>
                    <CardDescription>
                        Select candidates to create a shortlist for your recruitment pipeline.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center text-center text-muted-foreground h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : candidates.length === 0 ? (
                         <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                            <p>No candidates found in the database.</p>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="border rounded-lg"
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Experience</TableHead>
                                        <TableHead>Top Skills</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {candidates.map(candidate => (
                                        <motion.tr
                                            key={candidate.id}
                                            variants={itemVariants}
                                            className={cn("w-full transition-colors", selectedCandidates.has(candidate.id) && "bg-primary/10")}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedCandidates.has(candidate.id)}
                                                    onCheckedChange={() => handleSelectCandidate(candidate.id)}
                                                    aria-label="Select candidate"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
                                                        <AvatarFallback>{candidate.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{candidate.name}</div>
                                                        <div className="text-sm text-muted-foreground">{candidate.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{candidate.candidateSpecific?.experienceLevel || 'N/A'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {candidate.candidateSpecific?.skills?.slice(0, 3).map(skill => (
                                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                                    ))}
                                                     {candidate.candidateSpecific?.skills && candidate.candidateSpecific.skills.length > 3 && (
                                                        <Badge variant="secondary">...</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/candidates/${candidate.id}`)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Profile
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </TableBody>
                            </Table>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

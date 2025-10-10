
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getFirestore } from "firebase/firestore";
import type { Candidate } from "@/lib/types";

export default function CandidatesPage() {
  const firestore = getFirestore();

  const candidatesQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'users'), where('role', '==', 'candidate'));
  }, [firestore]);

  const { data: candidates, isLoading } = useCollection<Candidate>(candidatesQuery);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Candidates</h1>
          <p className="text-muted-foreground">Browse and manage all candidates in the system.</p>
        </div>
      </div>
      <Card className="bg-card/60 backdrop-blur-xl border-border/30">
        <CardHeader>
          <CardTitle>Candidate List</CardTitle>
          <CardDescription>
            A complete list of all candidates who have signed up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading candidates...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates?.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={candidate.avatarUrl} alt={candidate.displayName} />
                          <AvatarFallback>{candidate.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{candidate.displayName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{candidate.email}</TableCell>
                    <TableCell className="text-right font-mono">{candidate.xp}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View Profile</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

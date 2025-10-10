import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Assessment } from "@/lib/types";
import { Button } from "../ui/button";

interface RecentAssessmentsProps {
  assessments: Assessment[];
}

export default function RecentAssessments({ assessments }: RecentAssessmentsProps) {
  return (
    <Card className="bg-card/60 backdrop-blur-xl border-border/30">
      <CardHeader>
        <CardTitle>Recent Assessments</CardTitle>
        <CardDescription>Your performance history.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assessment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.map((assessment) => (
              <TableRow key={assessment.id}>
                <TableCell>
                  <div className="font-medium">{assessment.title}</div>
                  <div className="text-sm text-muted-foreground">{assessment.role}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={assessment.status === 'Completed' ? 'default' : 'secondary'} className="bg-green-600/20 text-green-400 border-green-600/30">
                    {assessment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{assessment.score}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View Details</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FolderKanban } from 'lucide-react';

export default function PipelinePage() {
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-8">Recruitment Pipeline</h1>
            <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                <CardHeader>
                    <CardTitle>Recruitment Pipeline</CardTitle>
                    <CardDescription>
                        This is a placeholder page for the recruitment pipeline. Feature coming soon.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                    <FolderKanban className="h-16 w-16 mb-4" />
                    <p>A Kanban-style board for tracking candidates will be here.</p>
                </CardContent>
            </Card>
        </div>
    );
}

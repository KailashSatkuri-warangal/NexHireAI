
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function RolesPage() {
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-8">Roles & Skills Management</h1>
            <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                <CardHeader>
                    <CardTitle>Roles & Skills</CardTitle>
                    <CardDescription>
                        This is a placeholder page for managing roles and skill sets. Feature coming soon.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                    <ShieldCheck className="h-16 w-16 mb-4" />
                    <p>Role and sub-skill management tools will be here.</p>
                </CardContent>
            </Card>
        </div>
    );
}

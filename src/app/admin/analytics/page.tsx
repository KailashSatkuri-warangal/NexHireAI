
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

export default function AnalyticsPage() {
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-8">Analytics Dashboard</h1>
            <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>
                        This is a placeholder page for platform analytics. Feature coming soon.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                    <BarChart className="h-16 w-16 mb-4" />
                    <p>Detailed charts and data visualizations will be here.</p>
                </CardContent>
            </Card>
        </div>
    );
}

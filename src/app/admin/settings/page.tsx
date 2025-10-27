
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-8">Admin Settings</h1>
            <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>
                        This is a placeholder page for admin settings. Feature coming soon.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                    <Settings className="h-16 w-16 mb-4" />
                    <p>Platform and account settings will be managed here.</p>
                </CardContent>
            </Card>
        </div>
    );
}

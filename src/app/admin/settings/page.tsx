
'use client';
import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Settings, Trash2, AlertTriangle, Loader2, Paintbrush, Bell, Puzzle, Wand2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { clearAllData } from '@/ai/flows/clear-data-flow';
import { populateRoles } from '@/ai/flows/populate-roles-flow';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
    const [isDeleting, startDeleteTransition] = useTransition();
    const [isPopulating, startPopulateTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [populateDialogOpen, setPopulateDialogOpen] = useState(false);
    const { toast } = useToast();

    const handleClearData = () => {
        startDeleteTransition(async () => {
            toast({
                title: "Clearing Data...",
                description: "This may take a moment. The page will reload upon completion.",
            });
            try {
                const result = await clearAllData();
                const total = Object.values(result.deletedCounts).reduce((acc, count) => acc + count, 0);
                toast({
                    title: "Data Cleared Successfully",
                    description: `${total} documents were removed from the database.`,
                });
                // Reload the page to reflect the cleared state
                window.location.reload();
            } catch (error) {
                 toast({
                    title: "Deletion Failed",
                    description: (error as Error).message || "An unexpected error occurred.",
                    variant: "destructive",
                });
            } finally {
                setDialogOpen(false);
            }
        });
    };

     const handlePopulateRoles = () => {
        startPopulateTransition(async () => {
            toast({
                title: "Populating Roles...",
                description: "AI is generating 30+ roles. This can take a moment.",
            });
            try {
                await populateRoles();
                toast({
                    title: "Roles Populated!",
                    description: "The 'roles' collection has been filled with new data.",
                });
            } catch (error) {
                toast({
                    title: "Population Failed",
                    description: (error as Error).message || "An unexpected error occurred.",
                    variant: "destructive",
                });
            } finally {
                setPopulateDialogOpen(false);
            }
        });
    };

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-8">Admin Settings</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Appearance Settings */}
                    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Paintbrush /> Appearance & Branding</CardTitle>
                            <CardDescription>
                                Customize the look and feel of your platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="relative">
                                         <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                            <Palette className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <Input defaultValue="#9c27b0" className="pl-10" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     <Label>Logo</Label>
                                     <Input type="file" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button disabled>Save Appearance</Button>
                        </CardFooter>
                    </Card>

                     {/* Notification Settings */}
                    <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bell /> Admin Notifications</CardTitle>
                            <CardDescription>
                                Manage the email notifications you receive from the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                <Label>New Candidate Signup</Label>
                                <p className="text-xs text-muted-foreground">
                                    Receive an email when a new candidate creates an account.
                                </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                <Label>Assessment Completed</Label>
                                <p className="text-xs text-muted-foreground">
                                    Get notified when a candidate submits an official assessment.
                                </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-destructive bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle /> Danger Zone
                            </CardTitle>
                            <CardDescription>
                                These actions are irreversible and will permanently affect your platform's data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-4 border border-destructive/20 rounded-lg">
                                <div>
                                    <h3 className="font-semibold">Clear All Platform Data</h3>
                                    <p className="text-sm text-muted-foreground">Wipe all users, roles, assessments, and cohorts.</p>
                                </div>
                                <Button variant="destructive" onClick={() => setDialogOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4"/> Clear Data
                                </Button>
                            </div>
                             <div className="flex justify-between items-center p-4 border border-amber-500/20 rounded-lg">
                                <div>
                                    <h3 className="font-semibold text-amber-600">Re-populate Roles</h3>
                                    <p className="text-sm text-muted-foreground">Use AI to clear and re-generate the master list of job roles.</p>
                                </div>
                                <Button variant="outline" onClick={() => setPopulateDialogOpen(true)}>
                                    <Wand2 className="mr-2 h-4 w-4 text-amber-600"/> Re-populate
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-1">
                     <Card className="bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Puzzle /> Integrations</CardTitle>
                             <CardDescription>
                                Connect NexHireAI to your favorite tools.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <IntegrationItem name="Slack" description="Send notifications to your team's channels." />
                            <IntegrationItem name="Greenhouse" description="Sync candidates with your ATS." />
                            <IntegrationItem name="Zapier" description="Connect to thousands of other apps." />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Clear Data Dialog */}
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all users, roles, assessments, questions, and cohort data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDeleting}
                            onClick={handleClearData}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Delete Everything
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             {/* Populate Roles Dialog */}
            <AlertDialog open={populateDialogOpen} onOpenChange={setPopulateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Role Population</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will use AI to generate a fresh list of 30+ job roles. This process is best run on a clean database. Are you sure you want to continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPopulating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isPopulating}
                            onClick={handlePopulateRoles}
                        >
                            {isPopulating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Populate Roles
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


const IntegrationItem = ({ name, description }: { name: string, description: string }) => (
    <>
        <div className="flex justify-between items-center">
            <div className="space-y-1">
                <h4 className="font-semibold">{name}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Button variant="secondary" disabled>Connect</Button>
        </div>
        <Separator />
    </>
);

    
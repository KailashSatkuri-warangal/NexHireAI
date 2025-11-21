
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Notification } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { firestore } = initializeFirebase();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user || !firestore) return;

        const notificationsQuery = query(collection(firestore, `users/${user.id}/notifications`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(notifs);
            setIsFetching(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setIsFetching(false);
        });

        return () => unsubscribe();
    }, [user, firestore]);

    const handleMarkAsRead = async (notificationId: string) => {
        if (!user || !firestore) return;
        const notifRef = doc(firestore, `users/${user.id}/notifications`, notificationId);
        await updateDoc(notifRef, { isRead: true });
    };

    if (isLoading || isFetching) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div className="relative min-h-full w-full p-4 md:p-8">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.1),rgba(255,255,255,0))]"></div>
            
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold mb-8 flex items-center gap-3"
            >
                <Bell /> Notifications
            </motion.h1>

            <Card className="max-w-4xl mx-auto bg-card/60 backdrop-blur-sm border-border/20 shadow-lg">
                <CardHeader>
                    <CardTitle>Your Inbox</CardTitle>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Inbox className="h-12 w-12 mx-auto mb-4" />
                            <p>No notifications yet. Check back later!</p>
                        </div>
                    ) : (
                        <motion.ul 
                             className="space-y-4"
                             variants={containerVariants}
                             initial="hidden"
                             animate="visible"
                        >
                            {notifications.map(notif => (
                                <motion.li key={notif.id} variants={itemVariants}>
                                    <div className={cn(
                                        "p-4 rounded-lg border flex items-start gap-4 transition-colors",
                                        notif.isRead ? "bg-card/50 border-border/30" : "bg-primary/10 border-primary/20"
                                    )}>
                                        <div className={cn("mt-1 h-2.5 w-2.5 rounded-full", !notif.isRead && "bg-primary")}></div>
                                        <div className="flex-grow">
                                            <p className="font-semibold">{notif.title}</p>
                                            <p className="text-sm text-muted-foreground">{notif.message}</p>
                                            <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {notif.link && (
                                                <Button asChild size="sm">
                                                    <Link href={notif.link}>View</Link>
                                                </Button>
                                            )}
                                            {!notif.isRead && (
                                                <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notif.id)}>
                                                    Mark as Read
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.li>
                            ))}
                        </motion.ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

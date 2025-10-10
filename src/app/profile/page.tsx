'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType, AnalysisSummary } from '@/lib/types';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { PersonalUnderstanding } from '@/components/profile/PersonalUnderstanding';
import { Skeleton } from '@/components/ui/skeleton';
import { analyzeResume } from '@/ai/flows/analyze-resume-flow';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { firestore } = initializeFirebase();
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchProfile = useCallback(async () => {
    if (user && firestore) {
      setIsLoading(true);
      try {
        const userDocRef = doc(firestore, 'users', user.id);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as UserType;
          setProfileData(data);
        } else {
          // If no profile exists in Firestore, create a basic one.
          // This can happen if user was created but profile creation failed.
          const basicProfile: UserType = {
            id: user.id,
            email: user.email,
            name: user.name || "New User",
            role: 'candidate', // default role
          };
          await setDoc(doc(firestore, "users", user.id), basicProfile);
          setProfileData(basicProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({ title: "Error", description: "Could not fetch profile.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, firestore, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  useEffect(() => {
    if (profileData?.analysis?.summary) {
        setIsFlipped(true); // Flip to analysis if it exists on load
    } else {
        setIsFlipped(false); // Default to front if no analysis
    }
  }, [profileData?.analysis?.summary]);

  const handleProfileUpdate = async (updatedData: Partial<UserType>) => {
    if (!user || !profileData) return;

    const userDocRef = doc(firestore, 'users', user.id);
    try {
        // Optimistically update UI
        const newData = { ...profileData, ...updatedData, 
          ...(updatedData.analysis && { analysis: { ...profileData.analysis, ...updatedData.analysis }})
        };
        setProfileData(newData as UserType);
        
        await setDoc(userDocRef, updatedData, { merge: true });
        toast({ title: "Success", description: "Profile updated successfully!" });
    } catch (error) {
        console.error("Error updating profile:", error);
        // Revert optimistic update on error
        setProfileData(profileData);
        toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    }
  };

  const runAnalysis = async () => {
      if (!profileData) return;
      
      const analysisInput = {
        skills: profileData.candidateSpecific?.skills || [],
        bio: profileData.candidateSpecific?.bio || '',
        experienceLevel: profileData.candidateSpecific?.experienceLevel || 'Fresher'
      }

      if(analysisInput.skills.length === 0 && !analysisInput.bio) {
        toast({
          title: "Not enough data",
          description: "Please add some skills and a bio to run the analysis.",
          variant: "destructive"
        });
        return;
      }
      
      try {
        toast({ title: "Analyzing Profile...", description: "This may take a moment." });
        const analysisResult: AnalysisSummary = await analyzeResume(analysisInput);
        
        await handleProfileUpdate({
            analysis: {
                summary: analysisResult
            }
        });
        setIsFlipped(true); // Flip to show the new analysis

      } catch(error) {
         console.error("Error running analysis:", error);
         toast({ title: "Analysis Failed", description: (error as Error).message || "An unknown error occurred.", variant: "destructive" });
      }
  }

  if (isLoading || authLoading || !profileData) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full bg-secondary">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.1),rgba(255,255,255,0))]"></div>
      
      <div className="container mx-auto px-4 py-8 md:px-6 flex items-center justify-center">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl"
            style={{ perspective: '1200px' }}
        >
          <motion.div 
            className="relative w-full h-full transition-transform duration-700"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
          >
            {/* Front of card: Profile View/Edit */}
            <div className="absolute w-full h-full backface-hidden">
                <ProfileCard 
                    profileData={profileData} 
                    onProfileUpdate={handleProfileUpdate} 
                    onRunAnalysis={runAnalysis}
                    onFlip={() => setIsFlipped(true)}
                />
            </div>

            {/* Back of card: Personal Understanding */}
            <div className="absolute w-full h-full backface-hidden" style={{ rotateY: 180 }}>
              {profileData.analysis?.summary ? (
                <PersonalUnderstanding 
                    analysis={profileData.analysis.summary} 
                    onFlip={() => setIsFlipped(false)}
                />
              ) : (
                // This is a fallback for the brief moment before the card flips back after analysis is cleared
                <div className="flex items-center justify-center h-full w-full rounded-3xl bg-card p-6">
                    <p>No analysis data available. Run the analysis to see insights.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

const ProfileSkeleton = () => (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-[500px] w-full rounded-3xl" />
      </div>
    </div>
);


'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAssessmentStore } from '@/hooks/use-assessment-store';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Timer, Loader2, ChevronLeft, ChevronRight, Send, Play } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { AssessmentAttempt, UserResponse, Question, CodeExecutionResult } from '@/lib/types';
import { CodeEditor } from '@/components/assessment/CodeEditor';
import { scoreAssessment } from '@/ai/flows/score-assessment-flow';
import { runAllCode } from '@/ai/flows/run-all-code-flow';

const AssessmentRunner = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { firestore } = initializeFirebase();
  const [isSubmitting, startSubmitting] = useTransition();
  const [isBatchRunning, startBatchRunning] = useTransition();
  
  const { user, isLoading: authLoading } = useAuth();
  const {
    assessment,
    responses,
    currentQuestionIndex,
    startTime,
    nextQuestion,
    prevQuestion,
    setResponse,
    setMultipleResponses,
    reset,
    isHydrated,
  } = useAssessmentStore();

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Redirect if user is not logged in or assessment is not loaded
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (isHydrated && !assessment) {
      toast({ title: "Assessment session not found.", description: "Please start a new assessment.", variant: "destructive" });
      router.push('/skill-assessment');
    }
  }, [user, authLoading, router, assessment, toast, isHydrated]);

  // Timer logic
  useEffect(() => {
    if (!startTime || !assessment) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = assessment.totalTimeLimit - elapsed;
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (!isSubmitting) { 
           toast({ title: "Time's up!", description: "Submitting your assessment automatically." });
           handleSubmit();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, assessment]);

  const handleSubmit = () => {
    if (!user || !assessment || !startTime) {
        toast({ title: "Error", description: "User or assessment data not found.", variant: "destructive" });
        return;
    }
    
    startSubmitting(async () => {
      toast({ title: "Submitting Assessment", description: "Evaluating your answers and generating feedback. This may take a minute." });

      const finalResponses: UserResponse[] = Object.values(responses).map(response => ({
        ...response,
        timeTaken: (Date.now() - startTime) / assessment.questions.length, // Approximate
      }));

      const attemptShell: Omit<AssessmentAttempt, 'id'> & { questions: Question[] } = {
          userId: user.id,
          assessmentId: assessment.id,
          roleId: assessment.roleId,
          startedAt: startTime,
          submittedAt: Date.now(),
          responses: finalResponses,
          questions: assessment.questions,
      };

      try {
          const scoredResult = await scoreAssessment(attemptShell);
          
          const finalAttempt: AssessmentAttempt = {
            id: assessment.id,
            userId: attemptShell.userId,
            assessmentId: attemptShell.assessmentId,
            roleId: attemptShell.roleId,
            startedAt: attemptShell.startedAt,
            submittedAt: attemptShell.submittedAt,
            ...scoredResult,
          };
          
          const attemptDocRef = doc(firestore, `users/${user.id}/assessments`, assessment.id);
          await setDoc(attemptDocRef, finalAttempt);
          
          toast({ title: "Assessment Submitted!", description: "Your results are now available on your dashboard." });
          reset();
          router.push('/dashboard');

      } catch (error) {
          console.error("Error submitting and scoring assessment:", error);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          const userFriendlyMessage = errorMessage.includes("429") 
            ? "Submission failed due to high traffic during scoring. This can be intermittent. Please wait a moment and try submitting again."
            : `An unexpected error occurred during submission. Details: ${errorMessage}`;
          toast({ title: "Submission Failed", description: userFriendlyMessage, variant: "destructive" });
      }
    });
  };

  const handleRunAllCode = () => {
    if (!assessment) return;
    const codingResponses = assessment.questions
      .filter(q => q.type === 'coding')
      .map(q => {
        const response = responses[q.id];
        return {
          questionId: q.id,
          code: response?.code || q.starterCode || '',
          language: response?.language || 'javascript',
          testCases: q.testCases || []
        };
      });

    if (codingResponses.length === 0) return;
    
    startBatchRunning(async () => {
      toast({ title: 'Running All Code...', description: 'Evaluating all coding solutions in a single batch.' });
      try {
        const results = await runAllCode({ submissions: codingResponses });
        const updatedResponses: Record<string, Partial<UserResponse>> = {};
        for (const [questionId, result] of Object.entries(results)) {
          updatedResponses[questionId] = { executionResult: result as CodeExecutionResult[] };
        }
        setMultipleResponses(updatedResponses);
        toast({ title: 'Batch Execution Finished!', description: 'Check the output panels for results.' });
      } catch (error) {
        console.error('Batch code execution failed:', error);
        toast({ title: 'Execution Error', description: (error as Error).message || 'An unexpected error occurred.', variant: 'destructive' });
      }
    });
  };


  if (authLoading || !assessment || !isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4">Loading Assessment...</p>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const currentResponse = responses[currentQuestion.id];
  const codingQuestionsCount = assessment.questions.filter(q => q.type === 'coding').length;

  const formatTime = (seconds: number) => {
    if (seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: string) => {
    setResponse(currentQuestion.id, { answer: value });
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full bg-secondary p-4 flex flex-col">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.1),rgba(255,255,255,0))]"></div>
      
      <Card className="w-full max-w-6xl mx-auto bg-card/70 backdrop-blur-sm border-border/20 shadow-xl flex flex-col flex-grow overflow-y-auto">
        <CardHeader className="border-b sticky top-0 bg-card/80 backdrop-blur-sm z-10">
           <div className="flex justify-between items-center">
             <CardTitle className="text-2xl">{assessment.roleName} Assessment</CardTitle>
             <div className="flex items-center gap-4">
                {codingQuestionsCount > 1 && (
                    <Button onClick={handleRunAllCode} disabled={isBatchRunning || isSubmitting} variant="secondary">
                        {isBatchRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                        Run All Code
                    </Button>
                )}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                    <Timer className="h-5 w-5" />
                    <span>{timeLeft !== null ? formatTime(timeLeft) : 'Loading...'}</span>
                </div>
             </div>
           </div>
           <div className="pt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-1 text-center">Question {currentQuestionIndex + 1} of {assessment.questions.length}</p>
           </div>
        </CardHeader>
        
        <div className="flex-grow p-6 overflow-y-auto">
            <div className="flex flex-col h-full">
                <h2 className="text-xl font-semibold mb-4">{currentQuestion.questionText}</h2>

                {currentQuestion.type === 'mcq' && (
                    <RadioGroup 
                        onValueChange={handleAnswerChange}
                        value={currentResponse?.answer}
                        className="space-y-3"
                    >
                        {currentQuestion.options?.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`option-${index}`} />
                                <Label htmlFor={`option-${index}`} className="text-base cursor-pointer">{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}

                {currentQuestion.type === 'short' && (
                    <Textarea 
                        placeholder="Your answer..." 
                        className="text-base"
                        rows={6}
                        value={currentResponse?.answer || ''}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                    />
                )}
                 {currentQuestion.type === 'coding' && (
                  <CodeEditor 
                      question={currentQuestion}
                      response={currentResponse}
                      onResponseChange={(change) => setResponse(currentQuestion.id, change)}
                  />
              )}
            </div>
        </div>

        <CardFooter className="flex justify-between border-t pt-6 sticky bottom-0 bg-card/80 backdrop-blur-sm">
            <Button variant="outline" onClick={prevQuestion} disabled={isSubmitting || isBatchRunning}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            {currentQuestionIndex === assessment.questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={isSubmitting || isBatchRunning}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                </Button>
            ) : (
                <Button onClick={nextQuestion} disabled={isSubmitting || isBatchRunning}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssessmentRunner;

    
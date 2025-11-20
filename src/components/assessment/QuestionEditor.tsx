'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Question } from "@/lib/types";
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useEffect } from "react";
import { PlusCircle, Trash2 } from "lucide-react";

interface QuestionEditorProps {
    question: Question | null;
    onSave: (question: Question) => void;
    onClose: () => void;
}

export function QuestionEditor({ question, onSave, onClose }: QuestionEditorProps) {
    const { register, handleSubmit, control, reset, watch, setValue } = useForm<Question>({
        defaultValues: question || undefined
    });

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "options"
    });

     const { fields: testCaseFields, append: appendTestCase, remove: removeTestCase } = useFieldArray({
        control,
        name: "testCases"
    });
    
    const questionType = watch("type");
    const optionsWatch = watch("options");

    useEffect(() => {
        if (question) {
            reset(question);
        }
    }, [question, reset]);

    const onSubmit = (data: Question) => {
        onSave(data);
    };

    // When a radio button for the correct answer is clicked, we update the `correctAnswer` field's value
    const handleCorrectAnswerChange = (optionIndex: number) => {
        const selectedOptionValue = optionsWatch?.[optionIndex];
        if(selectedOptionValue !== undefined){
            setValue('correctAnswer', selectedOptionValue);
        }
    };


    return (
        <Dialog open={!!question} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Question</DialogTitle>
                    <DialogDescription>Modify the details of the question below.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex-grow overflow-y-auto pr-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="questionText">Question Text</Label>
                        <Textarea id="questionText" {...register('questionText')} rows={4} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                             <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                                        <SelectItem value="short">Short Answer</SelectItem>
                                        <SelectItem value="coding">Coding</SelectItem>
                                    </SelectContent>
                                </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="difficulty">Difficulty</Label>
                             <Controller
                                name="difficulty"
                                control={control}
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Easy">Easy</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="skill">Skill</Label>
                            <Input id="skill" {...register('skill')} />
                        </div>
                    </div>
                    
                    {questionType === 'mcq' && (
                        <div className="space-y-4 pt-4 border-t">
                            <Label>Options & Correct Answer</Label>
                            <RadioGroup
                                value={watch('correctAnswer')}
                                className="space-y-2"
                            >
                                {fields.map((item, index) => (
                                    <div key={item.id} className="flex items-center gap-2">
                                        <RadioGroupItem value={watch(`options.${index}`)} id={`option-radio-${index}`} onClick={() => handleCorrectAnswerChange(index)}/>
                                        <Input {...register(`options.${index}`)} placeholder={`Option ${index + 1}`} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </RadioGroup>
                             <Button type="button" variant="outline" size="sm" onClick={() => append('')}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                            </Button>
                        </div>
                    )}
                    
                    {questionType === 'short' && (
                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="correctAnswer">Correct Answer</Label>
                            <Textarea id="correctAnswer" {...register('correctAnswer')} />
                        </div>
                    )}

                    {questionType === 'coding' && (
                        <div className="space-y-4 pt-4 border-t">
                             <div className="space-y-2">
                                <Label htmlFor="starterCode">Starter Code</Label>
                                <Textarea id="starterCode" {...register('starterCode')} rows={6} className="font-mono" />
                            </div>
                            <div className="space-y-2">
                                <Label>Test Cases</Label>
                                {testCaseFields.map((item, index) => (
                                    <div key={item.id} className="space-y-2 p-3 border rounded-md relative">
                                        <Label className="text-xs text-muted-foreground">Input</Label>
                                        <Textarea {...register(`testCases.${index}.input`)} rows={2} className="font-mono"/>
                                         <Label className="text-xs text-muted-foreground">Expected Output</Label>
                                        <Textarea {...register(`testCases.${index}.expectedOutput`)} rows={2} className="font-mono"/>
                                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeTestCase(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendTestCase({ input: '', expectedOutput: '' })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Test Case
                                </Button>
                            </div>
                        </div>
                    )}

                </form>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit(onSubmit)}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
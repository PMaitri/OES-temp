import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, Loader2, ChevronLeft, ChevronRight, Menu, AlertTriangle, Save, RotateCcw, CheckSquare, Shield } from "lucide-react";
import { useLockdown } from "@/hooks/use-lockdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface Question {
    id: string;
    questionText: string;
    imageData: string | null;
    questionType: string | "mcq" | "numeric";
    marks: number;
    negativeMarks?: number;
    orderIndex: number;
    options: Array<{
        id: string;
        optionText: string;
        orderIndex: number;
    }>;
}

interface Exam {
    id: string;
    title: string;
    description: string;
    duration: number;
    totalMarks: number;
    scheduledAt: string;
    endsAt: string;
    questions: Question[];
    isSubmitted?: boolean;
}

interface Answer {
    questionId: string;
    selectedOptions?: string[]; // For MCQ
    numericAnswer?: number;     // For Numeric
}

// Track local status for palette
type QuestionStatus = "not-visited" | "not-answered" | "answered" | "marked-for-review" | "answered-marked-for-review";

export default function TakeExam() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { user } = useAuth();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [questionStatus, setQuestionStatus] = useState<Record<string, QuestionStatus>>({});
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showViolationWarning, setShowViolationWarning] = useState(false);
    const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);

    // Lockdown/Proctoring Hook
    const { violations, isLocked, isFullscreen, startLockdown, stopLockdown } = useLockdown({
        onTabSwitch: () => {
            toast({
                variant: "destructive",
                title: "Warning: Tab Switch Detected",
                description: "Switching tabs during the exam is not allowed. This has been logged.",
            });
            setShowViolationWarning(true);
            setTimeout(() => setShowViolationWarning(false), 5000);
        },
        onFullscreenExit: () => {
            setShowFullscreenWarning(true);
            toast({
                variant: "destructive",
                title: "Warning: Fullscreen Exited",
                description: "Please stay in fullscreen mode during the exam.",
            });
        },
        maxViolations: 3,
        onMaxViolations: () => {
            toast({
                variant: "destructive",
                title: "Exam Auto-Submitted",
                description: "Too many violations detected. Your exam has been submitted automatically.",
            });
            handleSubmit();
        },
        enableFullscreen: true,
    });

    const { data: exam, isLoading } = useQuery<Exam>({
        queryKey: [`/api/student/exam/${id}`],
    });

    // Initialize status on load
    useEffect(() => {
        if (exam && exam.questions) {
            const initialStatus: Record<string, QuestionStatus> = {};
            exam.questions.forEach((q) => {
                initialStatus[q.id] = "not-visited";
            });
            // Mark first as not answered (visited)
            if (exam.questions.length > 0) {
                initialStatus[exam.questions[0].id] = "not-answered";
            }
            setQuestionStatus(initialStatus);

            // Duration
            const duration = exam.duration * 60;
            setTimeRemaining(duration);
        }
    }, [exam]);

    // Timer
    useEffect(() => {
        if (exam?.isSubmitted) {
            toast({
                title: "Exam already submitted",
                description: "Redirecting to results...",
            });
            setLocation(`/student/exam-result/${id}`);
            return;
        }

        if (exam && new Date(exam.scheduledAt) > new Date()) {
            toast({
                variant: "destructive",
                title: "Exam has not started yet",
                description: "Please wait for the scheduled time.",
            });
            setLocation("/student/dashboard");
            return;
        }

        if (!exam) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [exam]);

    // Start exam attempt
    useEffect(() => {
        if (!id) return;
        const startExam = async () => {
            try {
                await apiRequest("POST", `/api/student/exam/${id}/start`);
            } catch (error: any) {
                if (error.message.includes("400")) return;
                console.error("Failed to start exam session:", error);
            }
        };
        startExam();
    }, [id]);

    // Start lockdown when exam loads
    useEffect(() => {
        if (exam && !exam.isSubmitted) {
            console.log('Starting lockdown mode...');
            startLockdown();
        }
        return () => {
            console.log('Stopping lockdown mode...');
            stopLockdown();
        };
    }, [exam, startLockdown, stopLockdown]);

    // Additional ESC key blocker (backup)
    useEffect(() => {
        const blockEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                console.log('⛔ ESC key blocked!');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        };

        // Add listener with capture phase to catch it early
        document.addEventListener('keydown', blockEscape, true);
        window.addEventListener('keydown', blockEscape, true);

        return () => {
            document.removeEventListener('keydown', blockEscape, true);
            window.removeEventListener('keydown', blockEscape, true);
        };
    }, []);

    // Hide fullscreen warning when user re-enters fullscreen
    useEffect(() => {
        if (isFullscreen) {
            setShowFullscreenWarning(false);
        }
    }, [isFullscreen]);

    const submitExamMutation = useMutation({
        mutationFn: async (data: { answers: Answer[] }) => {
            return apiRequest("POST", `/api/student/exam/${id}/submit`, data);
        },
        onSuccess: (data: any) => {
            toast({
                title: "Exam submitted successfully",
                description: `Your score: ${data.totalScore}/${exam?.totalMarks}`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/student/results"] });
            setLocation("/student/results");
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Failed to submit exam",
                description: "Please try again",
            });
        },
    });

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const formattedAnswers = Object.values(answers);
        await submitExamMutation.mutateAsync({ answers: formattedAnswers });
    };

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: { questionId, selectedOptions: [optionId] }
        }));
    };

    const handleNumericInput = (questionId: string, value: string) => {
        const numValue = parseFloat(value);
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                questionId,
                numericAnswer: isNaN(numValue) ? undefined : numValue
            }
        }));
    };

    const updateStatus = (qId: string, status: QuestionStatus) => {
        setQuestionStatus(prev => ({ ...prev, [qId]: status }));
    };

    const handleSaveAndNext = () => {
        if (!exam) return;
        const currentQ = exam.questions[currentQuestionIndex];
        const hasAnswer = answers[currentQ.id];

        if (hasAnswer) {
            updateStatus(currentQ.id, "answered");
        } else {
            updateStatus(currentQ.id, "not-answered");
        }

        if (currentQuestionIndex < exam.questions.length - 1) {
            const nextId = exam.questions[currentQuestionIndex + 1].id;
            if (questionStatus[nextId] === "not-visited") {
                updateStatus(nextId, "not-answered");
            }
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleSaveAndMarkForReview = () => {
        if (!exam) return;
        const currentQ = exam.questions[currentQuestionIndex];
        const hasAnswer = answers[currentQ.id];

        if (hasAnswer) {
            updateStatus(currentQ.id, "answered-marked-for-review");
        } else {
            updateStatus(currentQ.id, "marked-for-review");
        }

        if (currentQuestionIndex < exam.questions.length - 1) {
            const nextId = exam.questions[currentQuestionIndex + 1].id;
            if (questionStatus[nextId] === "not-visited") {
                updateStatus(nextId, "not-answered");
            }
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleMarkForReviewAndNext = () => {
        // Same behavior logic basically, marks for review without saving answer? 
        // User requested NTA style. NTA "Mark for Review & Next" usually saves if answer selected.
        // We will assume "Mark for Review" means "Review Later" regardless of answer.
        handleSaveAndMarkForReview();
    };


    const handleClearResponse = () => {
        if (!exam) return;
        const currentQ = exam.questions[currentQuestionIndex];
        setAnswers(prev => {
            const newAnswers = { ...prev };
            delete newAnswers[currentQ.id];
            return newAnswers;
        });
        updateStatus(currentQ.id, "not-answered");
    };

    const handleNavigate = (index: number) => {
        if (!exam) return;
        // Update status of current before leaving if it was not visited?
        // Actually NTA logic: status updates happen on button click. 
        // Navigation via palette should just move.
        // But we should mark the target as "not-answered" (red) if it was "not-visited".
        const targetQ = exam.questions[index];
        if (questionStatus[targetQ.id] === "not-visited") {
            updateStatus(targetQ.id, "not-answered");
        }
        setCurrentQuestionIndex(index);
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!exam) return <div>Exam not found</div>;

    const currentQ = exam.questions[currentQuestionIndex];
    const currentAnswer = answers[currentQ.id];

    // Palette Counts
    const statusCounts = Object.values(questionStatus).reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Fullscreen Exit Warning Overlay */}
            {showFullscreenWarning && !isFullscreen && (
                <div className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex items-center justify-center">
                    <div className="text-center text-white p-8 max-w-md">
                        <AlertTriangle className="w-20 h-20 mx-auto mb-4 text-red-500 animate-bounce" />
                        <h2 className="text-3xl font-bold mb-4">⚠️ FULLSCREEN REQUIRED</h2>
                        <p className="text-xl mb-4">You have exited fullscreen mode!</p>
                        <p className="text-lg mb-6 text-yellow-400">Click the button below to continue the exam</p>
                        <Button
                            onClick={async () => {
                                const elem = document.documentElement;
                                try {
                                    if (elem.requestFullscreen) {
                                        await elem.requestFullscreen();
                                    } else if ((elem as any).webkitRequestFullscreen) {
                                        await (elem as any).webkitRequestFullscreen();
                                    }
                                } catch (error) {
                                    console.error('Failed to enter fullscreen:', error);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-8 py-4 mb-4"
                        >
                            RETURN TO FULLSCREEN
                        </Button>
                        <div className="text-red-500 font-bold text-2xl mt-4">
                            Violations: {violations}/3
                        </div>
                        <p className="text-sm mt-4 text-gray-400">
                            After 3 violations, your exam will be auto-submitted
                        </p>
                    </div>
                </div>
            )}

            {/* Violation Warning Banner */}
            {showViolationWarning && (
                <div className="bg-red-600 text-white px-4 py-2 text-center font-semibold animate-pulse">
                    <AlertTriangle className="inline w-4 h-4 mr-2" />
                    WARNING: Suspicious activity detected! Violations: {violations}/3
                </div>
            )}

            {/* Header */}
            <header className="h-16 border-b flex items-center justify-between px-4 bg-slate-900 text-white shrink-0">
                <div className="flex items-center gap-4">
                    {/* Branding */}
                    <div className="font-bold text-xl tracking-tight"></div>
                    {isLocked && (
                        <div className="flex items-center gap-2 text-xs bg-red-600 px-3 py-1 rounded">
                            <Shield className="w-3 h-3" />
                            PROCTORED MODE
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xs text-slate-300">Candidate Name</div>
                        <div className="font-semibold text-sm">{user?.fullName || "Student"}</div>
                    </div>
                    <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center text-xs">IMG</div>
                </div>
            </header>

            {/* Sub Header - Exam Title & Timer */}
            <div className="h-12 border-b bg-slate-100 flex items-center justify-between px-4 shrink-0">
                <h1 className="font-semibold text-slate-800">{exam.title}</h1>
                <div className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1 rounded">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
                    <span className="text-xs text-slate-400">Time Left</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Question Area */}
                <main className="flex-1 flex flex-col overflow-hidden bg-white relative">
                    <ScrollArea className="flex-1 p-6">
                        <div className="max-w-4xl mx-auto space-y-6 pb-20">
                            <div className="flex items-start gap-4">
                                <div className="font-bold text-lg text-slate-700 whitespace-nowrap">
                                    Question {currentQuestionIndex + 1}:
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="prose max-w-none text-lg">
                                        {currentQ.questionText}
                                    </div>

                                    {currentQ.imageData && (
                                        <img src={currentQ.imageData} alt="Question" className="max-h-64 rounded border p-2 bg-slate-50" />
                                    )}

                                    <div className="text-sm text-slate-500 italic">
                                        ({currentQ.marks} marks{currentQ.negativeMarks ? `, -${currentQ.negativeMarks} negative marks` : ""})
                                    </div>

                                    <Separator className="my-4" />

                                    {currentQ.questionType === "numeric" ? (
                                        <div className="space-y-2 max-w-xs">
                                            <Label>Answer (Numeric Value)</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter your answer"
                                                step="any"
                                                value={currentAnswer?.numericAnswer ?? ""}
                                                onChange={(e) => handleNumericInput(currentQ.id, e.target.value)}
                                                className="text-lg"
                                            />
                                        </div>
                                    ) : (
                                        <RadioGroup
                                            value={currentAnswer?.selectedOptions?.[0] || ""}
                                            onValueChange={(val) => handleOptionSelect(currentQ.id, val)}
                                            className="space-y-3"
                                        >
                                            {currentQ.options.map((opt) => (
                                                <div key={opt.id} className={cn(
                                                    "flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors hover:bg-slate-50",
                                                    currentAnswer?.selectedOptions?.[0] === opt.id && "border-primary bg-primary/5"
                                                )}>
                                                    <RadioGroupItem value={opt.id} id={opt.id} />
                                                    <Label htmlFor={opt.id} className="flex-1 cursor-pointer font-medium text-lg">
                                                        {opt.optionText}
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Bottom Navigation Bar */}
                    <div className="border-t bg-slate-50 p-4 shrink-0 flex items-center justify-between gap-4 flex-wrap z-10">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleSaveAndMarkForReview} className="hidden md:flex">
                                Save & Mark for Review
                            </Button>
                            <Button variant="outline" onClick={handleClearResponse} className="bg-white">
                                Clear Response
                            </Button>
                            <Button variant="outline" onClick={handleMarkForReviewAndNext} className="hidden md:flex">
                                Mark for Review & Next
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => handleNavigate(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={handleSaveAndNext}
                            >
                                Save & Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </main>

                {/* Right: Palette Sidebar */}
                <aside className="w-80 border-l bg-white flex flex-col shrink-0">
                    {/* Palette Header */}
                    <div className="p-4 bg-slate-50 border-b">
                        <h3 className="font-bold text-slate-800">Question Palette</h3>
                    </div>

                    {/* Palette Legend */}
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-slate-100 border text-slate-500 rounded font-bold">{statusCounts["not-visited"] || 0}</div>
                                    <span>Not Visited</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded font-bold clipped">{statusCounts["not-answered"] || 0}</div>
                                    <span>Not Answered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded font-bold clipped">{statusCounts["answered"] || 0}</div>
                                    <span>Answered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold">{statusCounts["marked-for-review"] || 0}</div>
                                    <span>Marked for Review</span>
                                </div>
                                <div className="flex items-center gap-2 col-span-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold relative">
                                        {statusCounts["answered-marked-for-review"] || 0}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <span>Ans & Marked for Review</span>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="font-semibold mb-3 text-sm text-slate-600">Choose a Question</h4>
                                <div className="grid grid-cols-5 gap-2">
                                    {exam.questions.map((q, idx) => {
                                        const status = questionStatus[q.id] || "not-visited";
                                        let bgClass = "bg-slate-100 text-slate-600 border hover:bg-slate-200"; // not-visited
                                        if (status === "not-answered") bgClass = "bg-red-500 text-white hover:bg-red-600 clipped-box";
                                        if (status === "answered") bgClass = "bg-green-500 text-white hover:bg-green-600 clipped-box";
                                        if (status === "marked-for-review") bgClass = "bg-purple-600 text-white rounded-full hover:bg-purple-700";
                                        if (status === "answered-marked-for-review") bgClass = "bg-purple-600 text-white rounded-full hover:bg-purple-700 border-2 border-green-500";

                                        if (currentQuestionIndex === idx) {
                                            // Highlight current
                                            bgClass += " ring-2 ring-blue-400 ring-offset-2";
                                        }

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => handleNavigate(idx)}
                                                className={cn(
                                                    "w-10 h-10 flex items-center justify-center font-bold text-sm transition-all rounded shadow-sm",
                                                    bgClass
                                                )}
                                            >
                                                {idx + 1}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Submit Button Area */}
                    <div className="p-4 border-t bg-slate-50 text-center">
                        <Button
                            size="lg"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            SUBMIT EXAM
                        </Button>
                    </div>
                </aside>

                {/* Mobile Palette Drawer */}
                <div className="lg:hidden absolute top-4 right-4 z-20">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline"><Menu className="w-5 h-5" /></Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 w-80">
                            {/* Replicate Sidebar Content here for Mobile */}
                            <div className="h-full flex flex-col bg-white">
                                <div className="p-4 border-b bg-slate-50">
                                    <SheetTitle>Question Palette</SheetTitle>
                                </div>
                                <ScrollArea className="flex-1 p-4">
                                    {/* Same palette grid */}
                                    <div className="grid grid-cols-5 gap-2">
                                        {exam.questions.map((q, idx) => {
                                            const status = questionStatus[q.id] || "not-visited";
                                            let bgClass = "bg-slate-100 text-slate-600 border";
                                            if (status === "not-answered") bgClass = "bg-red-500 text-white";
                                            if (status === "answered") bgClass = "bg-green-500 text-white";
                                            if (status === "marked-for-review") bgClass = "bg-purple-600 text-white rounded-full";
                                            if (status === "answered-marked-for-review") bgClass = "bg-purple-600 text-white rounded-full border-green-500 border-2";

                                            return (
                                                <button
                                                    key={q.id}
                                                    onClick={() => handleNavigate(idx)}
                                                    className={cn(
                                                        "w-10 h-10 flex items-center justify-center font-bold text-sm rounded",
                                                        bgClass
                                                    )}
                                                >
                                                    {idx + 1}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 border-t">
                                    <Button className="w-full" onClick={handleSubmit}>Submit Exam</Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </div>
    );
}

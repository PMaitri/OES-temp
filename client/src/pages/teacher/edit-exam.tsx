import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Save, Loader2, Upload, Image as ImageIcon, Check, ChevronsUpDown, Type, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "katex/dist/katex.min.css";
import Latex from "react-latex-next";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Class {
    id: string;
    name: string;
    section: string;
}

interface Question {
    type: "image" | "text" | "numeric";
    questionImage: string; // Base64 or URL
    questionText: string;
    options: string[];
    correctAnswer: "A" | "B" | "C" | "D";
    marks: number;
    negativeMarks: number;
    numericAnswer?: number | string;
    tolerance?: number | string;
}

export default function EditExam({ params }: { params: { id: string } }) {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const examId = params.id;

    const [examData, setExamData] = useState({
        title: "",
        description: "",
        classId: "",
        duration: 60,
        scheduledAt: "",
        endsAt: "",
    });

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<Question>({
        type: "image",
        questionImage: "",
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: "A",
        marks: 1,
        negativeMarks: 0,
        numericAnswer: 0,
        tolerance: 0,
    });

    const [imagePreview, setImagePreview] = useState<string>("");
    const [open, setOpen] = useState(false);
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"image" | "text" | "numeric">("image");

    const { data: classes } = useQuery<Class[]>({
        queryKey: ["/api/teacher/all-classes"],
    });

    const { data: exam, isLoading: isLoadingExam, isError, error } = useQuery<any>({
        queryKey: [`/api/teacher/exam/${examId}`],
        enabled: !!examId,
    });

    useEffect(() => {
        if (exam) {
            setExamData({
                title: exam.title,
                description: exam.description || "",
                classId: exam.classId,
                duration: exam.duration,
                scheduledAt: exam.scheduledAt ? new Date(exam.scheduledAt).toISOString().slice(0, 16) : "",
                endsAt: exam.endsAt ? new Date(exam.endsAt).toISOString().slice(0, 16) : "",
            });

            if (exam.classIds) {
                setSelectedClassIds(exam.classIds);
            } else if (exam.classId) {
                setSelectedClassIds([exam.classId]);
            }

            const parsedQuestions = exam.questions.map((q: any) => {
                let questionImage = "";
                let questionText = "";
                let type: "image" | "text" = "text";
                // Initial options array for inputs
                let options = ["", "", "", ""];

                // Check imageData first (how backend stores it for pure image)
                if (q.imageData) {
                    questionImage = q.imageData;
                    type = "image";
                }
                // Fallback: Check if questionText contains [IMAGE] prefix
                else if (q.questionText && q.questionText.startsWith("[IMAGE]")) {
                    questionImage = q.questionText.substring(7);
                    type = "image";
                } else {
                    questionText = q.questionText || "";
                    type = "text";
                    // Map existing options to the array, preserving order A, B, C, D
                    if (q.options && q.options.length > 0) {
                        // assuming options are sorted or we rely on simple mapping
                        options = q.options.map((o: any) => o.optionText || "");
                        while (options.length < 4) options.push("");
                    }
                }

                // Determine correct Answer "A", "B", "C", "D"
                const correctIndex = q.options.findIndex((o: any) => o.isCorrect);
                const correctAnswer = correctIndex !== -1 ? String.fromCharCode(65 + correctIndex) as "A" | "B" | "C" | "D" : "A";

                return {
                    type,
                    questionImage,
                    questionText,
                    options,
                    correctAnswer,
                    marks: q.marks,
                    negativeMarks: q.negativeMarks || 0,
                    numericAnswer: q.numericAnswer,
                    tolerance: q.numericTolerance || 0,
                };
            });
            setQuestions(parsedQuestions);
        }
    }, [exam]);

    const updateExamMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiRequest("PUT", `/api/teacher/exam/${examId}`, data);
        },
        onSuccess: () => {
            toast({
                title: "Exam updated successfully",
                description: "Your changes have been saved",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/teacher/exams"] });
            setLocation("/teacher/exams");
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Failed to update exam",
                description: error.message || "Please try again",
            });
        },
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    variant: "destructive",
                    title: "File too large",
                    description: "Please upload an image smaller than 5MB",
                });
                return;
            }

            if (!file.type.startsWith("image/")) {
                toast({
                    variant: "destructive",
                    title: "Invalid file type",
                    description: "Please upload an image file",
                });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                setCurrentQuestion({ ...currentQuestion, questionImage: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...currentQuestion.options];
        newOptions[index] = value;
        setCurrentQuestion({ ...currentQuestion, options: newOptions });
    };

    const addQuestion = () => {
        if (activeTab === "image" && !currentQuestion.questionImage) {
            toast({
                variant: "destructive",
                title: "Question image is required",
                description: "Please upload a question image",
            });
            return;
        }

        if (activeTab === "text") {
            if (!currentQuestion.questionText.trim()) {
                toast({
                    variant: "destructive",
                    title: "Question text is required",
                });
                return;
            }
            if (currentQuestion.options.some(opt => !opt.trim())) {
                toast({
                    variant: "destructive",
                    title: "All options are required",
                    description: "Please provide text for all options A, B, C, and D",
                });
                return;
            }
        }

        if (activeTab === "numeric") {
            if (!currentQuestion.questionText.trim()) {
                toast({
                    variant: "destructive",
                    title: "Question text is required",
                });
                return;
            }
            if (currentQuestion.numericAnswer === undefined || currentQuestion.numericAnswer === "" || isNaN(Number(currentQuestion.numericAnswer))) {
                toast({
                    variant: "destructive",
                    title: "Numeric answer is required",
                });
                return;
            }
        }

        setQuestions([...questions, { ...currentQuestion, type: activeTab }]);
        setCurrentQuestion({
            type: activeTab,
            questionImage: "",
            questionText: "",
            options: ["", "", "", ""],
            correctAnswer: "A",
            marks: 1,
            negativeMarks: 0,
            numericAnswer: 0,
        });
        setImagePreview("");
        // Keep the tab active
        setCurrentQuestion(prev => ({ ...prev, type: activeTab }));
    };

    const editQuestion = (index: number) => {
        const q = questions[index];
        setCurrentQuestion({ ...q });
        if (q.type === 'image') {
            setImagePreview(q.questionImage);
        } else {
            setImagePreview("");
        }
        setActiveTab(q.type);
        removeQuestion(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast({
            title: "Editing Question",
            description: "Question loaded into the form. Make changes and click 'Add Question' to save.",
        });
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (questions.length === 0) {
            toast({
                variant: "destructive",
                title: "No questions",
                description: "Please add at least one question",
            });
            return;
        }

        const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

        const formattedQuestions = questions.map((q) => {
            if (q.type === "image") {
                return {
                    questionText: `[IMAGE]${q.questionImage}`,
                    questionType: "mcq",
                    marks: q.marks,
                    negativeMarks: q.negativeMarks,
                    difficulty: "medium",
                    subjectId: "",
                    options: [
                        { text: "A", isCorrect: q.correctAnswer === "A" },
                        { text: "B", isCorrect: q.correctAnswer === "B" },
                        { text: "C", isCorrect: q.correctAnswer === "C" },
                        { text: "D", isCorrect: q.correctAnswer === "D" },
                    ],
                };
            } else if (q.type === "numeric") {
                return {
                    questionText: q.questionText,
                    questionType: "numeric",
                    marks: q.marks,
                    negativeMarks: q.negativeMarks,
                    difficulty: "medium",
                    subjectId: "",
                    numericAnswer: Number(q.numericAnswer),
                    tolerance: Number(q.tolerance || 0),
                };
            } else {
                return {
                    questionText: q.questionText,
                    questionType: "mcq",
                    marks: q.marks,
                    negativeMarks: q.negativeMarks,
                    difficulty: "medium",
                    subjectId: "",
                    options: q.options.map((optText, idx) => ({
                        text: optText,
                        isCorrect: q.correctAnswer === String.fromCharCode(65 + idx),
                    })),
                };
            }
        });

        if (selectedClassIds.length === 0) {
            toast({
                variant: "destructive",
                title: "No class selected",
                description: "Please select at least one class",
            });
            return;
        }

        await updateExamMutation.mutateAsync({
            ...examData,
            classId: selectedClassIds[0],
            classIds: selectedClassIds,
            totalMarks,
            passingMarks: Math.floor(totalMarks * 0.4),
            negativeMarking: false,
            shuffleQuestions: false,
            shuffleOptions: false,
            showResults: true,
            questions: formattedQuestions,
        });
    };



    if (isLoadingExam) {
        return (
            <div className="min-h-screen bg-background">
                <AppNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-background">
                <AppNavbar />
                <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
                    <p className="text-destructive text-xl mb-4">Error loading exam</p>
                    <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
                    <Button onClick={() => setLocation("/teacher/exams")}>Back to Exams</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AppNavbar />

            <main className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Edit Exam</h1>
                    <p className="text-muted-foreground">Update exam details and questions</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Exam Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Exam Details</CardTitle>
                            <CardDescription>Basic information about the exam</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Exam Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Mathematics Mid-Term"
                                        value={examData.title}
                                        onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="class">Class *</Label>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="w-full justify-between"
                                            >
                                                {selectedClassIds.length > 0
                                                    ? `${selectedClassIds.length} classes selected`
                                                    : "Select classes..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Search class..." />
                                                <CommandList>
                                                    <CommandEmpty>No class found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {classes?.map((cls) => (
                                                            <CommandItem
                                                                key={cls.id}
                                                                value={cls.id}
                                                                onSelect={() => {
                                                                    setSelectedClassIds(prev =>
                                                                        prev.includes(cls.id)
                                                                            ? prev.filter(id => id !== cls.id)
                                                                            : [...prev, cls.id]
                                                                    )
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedClassIds.includes(cls.id) ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {cls.name} {cls.section ? `- ${cls.section}` : ""}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Brief description of the exam"
                                    value={examData.description}
                                    onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration (minutes) *</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min="1"
                                        value={examData.duration}
                                        onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="scheduledAt">Start Date & Time *</Label>
                                    <Input
                                        id="scheduledAt"
                                        type="datetime-local"
                                        value={examData.scheduledAt}
                                        onChange={(e) => setExamData({ ...examData, scheduledAt: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endsAt">End Date & Time *</Label>
                                    <Input
                                        id="endsAt"
                                        type="datetime-local"
                                        value={examData.endsAt}
                                        onChange={(e) => setExamData({ ...examData, endsAt: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add Questions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Questions</CardTitle>
                            <CardDescription>Add, remove, or update questions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="image" className="flex gap-2">
                                        <FileImage className="w-4 h-4" />
                                        Image Based
                                    </TabsTrigger>
                                    <TabsTrigger value="text" className="flex gap-2">
                                        <Type className="w-4 h-4" />
                                        Text Based
                                    </TabsTrigger>
                                    <TabsTrigger value="numeric" className="flex gap-2">
                                        <Type className="w-4 h-4" />
                                        Numeric
                                    </TabsTrigger>
                                </TabsList>

                                <div className="space-y-4">
                                    <TabsContent value="image" className="mt-0 space-y-4">
                                        <div className="space-y-2">
                                            <Label>Question Image *</Label>
                                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                    id="question-image"
                                                />
                                                <label htmlFor="question-image" className="cursor-pointer">
                                                    {imagePreview ? (
                                                        <div className="space-y-2">
                                                            <img
                                                                src={imagePreview}
                                                                alt="Question preview"
                                                                className="max-h-64 mx-auto rounded-lg shadow-md"
                                                            />
                                                            <p className="text-sm text-muted-foreground">Click to change image</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                                                            <div>
                                                                <p className="text-sm font-medium">Click to upload new question image</p>
                                                                <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="text" className="mt-0 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="question-text">Question Text *</Label>
                                            <Textarea
                                                id="question-text"
                                                placeholder="Type your question here..."
                                                value={currentQuestion.questionText}
                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                                                rows={3}
                                                className="text-lg"
                                            />
                                            {currentQuestion.questionText && (
                                                <div className="mt-2 p-4 bg-muted/30 rounded-md border min-h-[60px]">
                                                    <Label className="text-xs text-muted-foreground mb-2 block">Preview (LaTeX supported):</Label>
                                                    <div className="prose prose-sm max-w-none">
                                                        <Latex>{currentQuestion.questionText}</Latex>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <Label>Options *</Label>
                                            <div className="grid gap-3">
                                                {["A", "B", "C", "D"].map((option, index) => (
                                                    <div key={option} className="flex gap-3 items-center">
                                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold shrink-0">
                                                            {option}
                                                        </div>
                                                        <Input
                                                            placeholder={`Option ${option} text`}
                                                            value={currentQuestion.options[index]}
                                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="numeric" className="mt-0 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="numeric-question-text">Question Text *</Label>
                                            <Textarea
                                                id="numeric-question-text"
                                                placeholder="Type your numeric question here..."
                                                value={currentQuestion.questionText}
                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                                                rows={3}
                                                className="text-lg"
                                            />
                                            {currentQuestion.questionText && (
                                                <div className="mt-2 p-4 bg-muted/30 rounded-md border min-h-[60px]">
                                                    <Label className="text-xs text-muted-foreground mb-2 block">Preview (LaTeX supported):</Label>
                                                    <div className="prose prose-sm max-w-none">
                                                        <Latex>{currentQuestion.questionText}</Latex>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="numeric-answer">Correct Answer (Numeric) *</Label>
                                            <Input
                                                id="numeric-answer"
                                                type="number"
                                                step="any"
                                                placeholder="e.g. 89.09"
                                                value={currentQuestion.numericAnswer || ""}
                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, numericAnswer: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="numeric-tolerance">Tolerance (+/-)</Label>
                                            <Input
                                                id="numeric-tolerance"
                                                type="number"
                                                step="any"
                                                min="0"
                                                placeholder="e.g. 0.1"
                                                value={currentQuestion.tolerance || ""}
                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, tolerance: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">Range of acceptable values (e.g. correct answer 10 +/- 0.5)</p>
                                        </div>
                                    </TabsContent>

                                    <Separator className="my-4" />

                                    {/* Correct Answer Selection - Shared */}
                                    {activeTab !== "numeric" && (
                                        <div className="space-y-3">
                                            <Label>Correct Answer *</Label>
                                            <RadioGroup
                                                value={currentQuestion.correctAnswer}
                                                onValueChange={(value: any) =>
                                                    setCurrentQuestion({ ...currentQuestion, correctAnswer: value })
                                                }
                                                className="grid grid-cols-4 gap-4"
                                            >
                                                {["A", "B", "C", "D"].map((option) => (
                                                    <div
                                                        key={option}
                                                        className={cn(
                                                            "border rounded-lg transition-colors bg-white",
                                                            currentQuestion.correctAnswer === option
                                                                ? "bg-primary/5 border-primary"
                                                                : "hover:bg-accent"
                                                        )}
                                                    >
                                                        <Label
                                                            htmlFor={`option-${option}`}
                                                            className="flex items-center space-x-2 p-4 cursor-pointer w-full h-full"
                                                        >
                                                            <RadioGroupItem value={option} id={`option-${option}`} />
                                                            <span className="text-xl font-bold flex-1 text-center">
                                                                {option}
                                                            </span>
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    )}

                                    {/* Marks - Shared */}
                                    <div className="space-y-2">
                                        <Label htmlFor="marks">Marks per Question</Label>
                                        <Input
                                            id="marks"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={currentQuestion.marks}
                                            onChange={(e) =>
                                                setCurrentQuestion({ ...currentQuestion, marks: parseFloat(e.target.value) })
                                            }
                                            step="any"
                                            className="max-w-[200px]"
                                        />
                                    </div>

                                    {/* Negative Marks */}
                                    <div className="space-y-2">
                                        <Label htmlFor="negativeMarks">Negative Marks</Label>
                                        <Input
                                            id="negativeMarks"
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={currentQuestion.negativeMarks}
                                            onChange={(e) =>
                                                setCurrentQuestion({ ...currentQuestion, negativeMarks: parseFloat(e.target.value) })
                                            }
                                            step="any"
                                            className="max-w-[200px]"
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={addQuestion}
                                        className="w-full"
                                        size="lg"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add Question
                                    </Button>
                                </div>
                            </Tabs>

                            {questions.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-lg">
                                                Questions ({questions.length})
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                Total Marks: {questions.reduce((sum, q) => sum + q.marks, 0)}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {questions.map((q, index) => (
                                                <div
                                                    key={index}
                                                    className="relative border rounded-lg p-4 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="absolute top-2 right-2 flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => editQuestion(index)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeQuestion(index)}
                                                            className="h-8 w-8"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-bold text-lg">Q{index + 1}</span>
                                                            {q.type === "numeric" ? (
                                                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                                    Answer: {q.numericAnswer}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                                    Answer: {q.correctAnswer}
                                                                </span>
                                                            )}
                                                            <span className="text-xs bg-secondary px-2 py-1 rounded">
                                                                {q.marks} mark{q.marks > 1 ? "s" : ""}
                                                            </span>
                                                            {q.negativeMarks > 0 && (
                                                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                                                    -{q.negativeMarks} neg
                                                                </span>
                                                            )}
                                                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded capitalize">
                                                                {q.type}
                                                            </span>
                                                        </div>
                                                        {q.type === 'image' ? (
                                                            <img
                                                                src={q.questionImage}
                                                                alt={`Question ${index + 1}`}
                                                                className="w-full rounded-md border max-h-48 object-contain bg-slate-50"
                                                            />
                                                        ) : (
                                                            <div className="p-3 bg-muted/30 rounded-md text-sm">
                                                                <p className="font-medium line-clamp-2 mb-2">{q.questionText}</p>
                                                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                                    {q.options.map((opt, i) => (
                                                                        <div key={i} className={cn("truncate", q.correctAnswer === String.fromCharCode(65 + i) && "text-primary font-medium")}>
                                                                            {String.fromCharCode(65 + i)}. {opt}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setLocation("/teacher/exams")}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateExamMutation.isPending}
                            size="lg"
                        >
                            {updateExamMutation.isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Updating Exam...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Update Exam
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}

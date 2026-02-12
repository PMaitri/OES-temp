import { useState } from "react";
import { useLocation } from "wouter";
import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Question {
  questionText: string;
  questionType: "mcq" | "msq" | "numeric" | "true_false";
  marks: number;
  difficulty: string;
  subjectId: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  numericAnswer?: string;
}

export default function CreateExam() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [examData, setExamData] = useState({
    title: "",
    description: "",
    classId: "",
    duration: 60,
    passingMarks: 40,
    scheduledAt: "",
    endsAt: "",
    instructions: "",
    negativeMarking: false,
    negativeMarks: 0,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResults: true,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    questionText: "",
    questionType: "mcq",
    marks: 1,
    difficulty: "medium",
    subjectId: "",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/teacher/classes"],
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const createExamMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/teacher/exams", data);
    },
    onSuccess: () => {
      toast({
        title: "Exam created successfully",
        description: "Your exam has been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/exams"] });
      setLocation("/teacher/dashboard");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to create exam",
        description: "Please try again",
      });
    },
  });

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { text: "", isCorrect: false }],
    });
  };

  const removeOption = (index: number) => {
    const updated = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: updated });
  };

  const updateOption = (index: number, field: "text" | "isCorrect", value: string | boolean) => {
    const updated = currentQuestion.options.map((opt, i) =>
      i === index ? { ...opt, [field]: value } : opt
    );
    setCurrentQuestion({ ...currentQuestion, options: updated });
  };

  const addQuestion = () => {
    if (!currentQuestion.questionText) {
      toast({
        variant: "destructive",
        title: "Question text is required",
      });
      return;
    }

    setQuestions([...questions, currentQuestion]);
    setCurrentQuestion({
      questionText: "",
      questionType: "mcq",
      marks: 1,
      difficulty: "medium",
      subjectId: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    });

    toast({
      title: "Question added",
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (questions.length === 0) {
      toast({
        variant: "destructive",
        title: "Add at least one question",
      });
      return;
    }

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    await createExamMutation.mutateAsync({
      ...examData,
      totalMarks,
      questions,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <main className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Create New Exam</h1>
          <p className="text-muted-foreground">Set up exam details and add questions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                    data-testid="input-exam-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class *</Label>
                  <Select
                    value={examData.classId}
                    onValueChange={(value) => setExamData({ ...examData, classId: value })}
                    required
                  >
                    <SelectTrigger data-testid="select-class">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the exam"
                  value={examData.description}
                  onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                  data-testid="textarea-description"
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
                    data-testid="input-duration"
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
                    data-testid="input-scheduled-at"
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
                    data-testid="input-ends-at"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="negativeMarking">Enable Negative Marking</Label>
                  <Switch
                    id="negativeMarking"
                    checked={examData.negativeMarking}
                    onCheckedChange={(checked) =>
                      setExamData({ ...examData, negativeMarking: checked })
                    }
                    data-testid="switch-negative-marking"
                  />
                </div>
                {examData.negativeMarking && (
                  <div className="space-y-2">
                    <Label htmlFor="negativeMarks">Negative Marks per Wrong Answer</Label>
                    <Input
                      id="negativeMarks"
                      type="number"
                      min="0"
                      step="0.25"
                      value={examData.negativeMarks}
                      onChange={(e) =>
                        setExamData({ ...examData, negativeMarks: parseFloat(e.target.value) })
                      }
                      data-testid="input-negative-marks"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="shuffleQuestions"
                    checked={examData.shuffleQuestions}
                    onCheckedChange={(checked) =>
                      setExamData({ ...examData, shuffleQuestions: checked })
                    }
                    data-testid="switch-shuffle-questions"
                  />
                  <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="shuffleOptions"
                    checked={examData.shuffleOptions}
                    onCheckedChange={(checked) =>
                      setExamData({ ...examData, shuffleOptions: checked })
                    }
                    data-testid="switch-shuffle-options"
                  />
                  <Label htmlFor="shuffleOptions">Shuffle Options</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showResults"
                    checked={examData.showResults}
                    onCheckedChange={(checked) =>
                      setExamData({ ...examData, showResults: checked })
                    }
                    data-testid="switch-show-results"
                  />
                  <Label htmlFor="showResults">Show Results After Submission</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Add Questions</CardTitle>
              <CardDescription>Create questions for this exam</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="questionText">Question Text *</Label>
                  <Textarea
                    id="questionText"
                    placeholder="Enter your question"
                    value={currentQuestion.questionText}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })
                    }
                    data-testid="textarea-question-text"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionType">Question Type</Label>
                    <Select
                      value={currentQuestion.questionType}
                      onValueChange={(value: any) =>
                        setCurrentQuestion({ ...currentQuestion, questionType: value })
                      }
                    >
                      <SelectTrigger data-testid="select-question-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice (Single)</SelectItem>
                        <SelectItem value="msq">Multiple Choice (Multiple)</SelectItem>
                        <SelectItem value="numeric">Numeric</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marks">Marks</Label>
                    <Input
                      id="marks"
                      type="number"
                      min="1"
                      value={currentQuestion.marks}
                      onChange={(e) =>
                        setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })
                      }
                      data-testid="input-question-marks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={currentQuestion.difficulty}
                      onValueChange={(value) =>
                        setCurrentQuestion({ ...currentQuestion, difficulty: value })
                      }
                    >
                      <SelectTrigger data-testid="select-difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(currentQuestion.questionType === "mcq" ||
                  currentQuestion.questionType === "msq" ||
                  currentQuestion.questionType === "true_false") && (
                  <div className="space-y-3">
                    <Label>Options</Label>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Checkbox
                          checked={option.isCorrect}
                          onCheckedChange={(checked) =>
                            updateOption(index, "isCorrect", !!checked)
                          }
                          data-testid={`checkbox-correct-${index}`}
                        />
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option.text}
                          onChange={(e) => updateOption(index, "text", e.target.value)}
                          className="flex-1"
                          data-testid={`input-option-${index}`}
                        />
                        {currentQuestion.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            data-testid={`button-remove-option-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {currentQuestion.questionType !== "true_false" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        data-testid="button-add-option"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </Button>
                    )}
                  </div>
                )}

                {currentQuestion.questionType === "numeric" && (
                  <div className="space-y-2">
                    <Label htmlFor="numericAnswer">Correct Answer</Label>
                    <Input
                      id="numericAnswer"
                      type="text"
                      placeholder="Enter numeric answer"
                      value={currentQuestion.numericAnswer || ""}
                      onChange={(e) =>
                        setCurrentQuestion({ ...currentQuestion, numericAnswer: e.target.value })
                      }
                      data-testid="input-numeric-answer"
                    />
                  </div>
                )}

                <Button type="button" onClick={addQuestion} data-testid="button-add-question">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {questions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium">Added Questions ({questions.length})</h4>
                    {questions.map((q, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 border rounded-md"
                      >
                        <div className="flex-1">
                          <p className="font-medium mb-1">
                            {index + 1}. {q.questionText}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Type: {q.questionType} | Marks: {q.marks} | Difficulty: {q.difficulty}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(index)}
                          data-testid={`button-remove-question-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
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
              onClick={() => setLocation("/teacher/dashboard")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createExamMutation.isPending}
              data-testid="button-create-exam"
            >
              {createExamMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Exam
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

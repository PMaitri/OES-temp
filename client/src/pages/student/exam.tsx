import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Clock, AlertTriangle, Check, Minus, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Question {
  id: string;
  questionText: string;
  questionType: "mcq" | "msq" | "numeric" | "true_false";
  marks: number;
  orderIndex: number;
  subjectId: string | null;
  options: Array<{
    id: string;
    optionText: string;
    orderIndex: number;
  }>;
}

interface ExamData {
  id: string;
  title: string;
  duration: number;
  totalMarks: number;
  instructions: string | null;
  questions: Question[];
  attemptId: string;
  timeRemaining: number;
}

interface StudentAnswer {
  questionId: string;
  selectedOptions?: string[];
  numericAnswer?: string;
  isVisited: boolean;
  isMarkedForReview: boolean;
}

export default function ExamPage() {
  const [, params] = useRoute("/student/exam/:id");
  const [, setLocation] = useLocation();
  const examId = params?.id;
  const { toast } = useToast();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, StudentAnswer>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  const { data: examData, isLoading } = useQuery<ExamData>({
    queryKey: ["/api/student/exam", examId],
    enabled: !!examId,
  });

  const saveAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: string; answer: StudentAnswer }) => {
      return apiRequest("POST", `/api/student/exam/${examId}/answer`, data);
    },
  });

  const submitExamMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/student/exam/${examId}/submit`, {});
    },
    onSuccess: () => {
      toast({
        title: "Exam submitted successfully",
        description: "Your answers have been recorded",
      });
      setLocation("/student/results");
    },
  });

  // Timer countdown
  useEffect(() => {
    if (!examData) return;
    setTimeRemaining(examData.timeRemaining);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          submitExamMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examData]);

  // Anti-cheating: Tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        setShowWarning(true);
        // Log cheating attempt
        apiRequest("POST", `/api/student/exam/${examId}/cheating-log`, {
          activityType: "tab_change",
          description: "Student switched tabs",
        });
      }
    };

    const handleBlur = () => {
      setFocusLossCount((prev) => prev + 1);
      apiRequest("POST", `/api/student/exam/${examId}/cheating-log`, {
        activityType: "focus_loss",
        description: "Student lost focus",
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [examId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = examData?.questions[currentQuestionIndex];

  const getCurrentAnswer = (): StudentAnswer => {
    if (!currentQuestion) {
      return {
        questionId: "",
        isVisited: false,
        isMarkedForReview: false,
      };
    }
    return (
      answers.get(currentQuestion.id) || {
        questionId: currentQuestion.id,
        isVisited: true,
        isMarkedForReview: false,
      }
    );
  };

  const saveAnswer = useCallback(
    (answer: Partial<StudentAnswer>) => {
      if (!currentQuestion) return;

      const currentAnswer = getCurrentAnswer();
      const updatedAnswer = {
        ...currentAnswer,
        ...answer,
        isVisited: true,
      };

      setAnswers((prev) => new Map(prev).set(currentQuestion.id, updatedAnswer));
      saveAnswerMutation.mutate({
        questionId: currentQuestion.id,
        answer: updatedAnswer,
      });
    },
    [currentQuestion]
  );

  const handleNext = () => {
    if (currentQuestionIndex < (examData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleClear = () => {
    if (!currentQuestion) return;
    saveAnswer({
      selectedOptions: undefined,
      numericAnswer: undefined,
    });
  };

  const handleMarkForReview = () => {
    const currentAnswer = getCurrentAnswer();
    saveAnswer({
      isMarkedForReview: !currentAnswer.isMarkedForReview,
    });
  };

  const getQuestionStatus = (questionId: string) => {
    const answer = answers.get(questionId);
    if (!answer) return "not-visited";
    if (answer.isMarkedForReview) return "marked";
    if (answer.selectedOptions?.length || answer.numericAnswer) return "answered";
    if (answer.isVisited) return "visited";
    return "not-visited";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "bg-chart-2 text-white";
      case "marked":
        return "bg-chart-4 text-white";
      case "visited":
        return "bg-muted text-foreground";
      default:
        return "bg-background border border-border";
    }
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;
    const currentAnswer = getCurrentAnswer();

    if (currentQuestion.questionType === "mcq") {
      return (
        <RadioGroup
          value={currentAnswer.selectedOptions?.[0] || ""}
          onValueChange={(value) => saveAnswer({ selectedOptions: [value] })}
        >
          <div className="space-y-4">
            {currentQuestion.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 p-4 rounded-md border hover-elevate"
              >
                <RadioGroupItem value={option.id} id={option.id} data-testid={`option-${option.id}`} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.optionText}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      );
    }

    if (currentQuestion.questionType === "msq") {
      return (
        <div className="space-y-4">
          {currentQuestion.options.map((option) => (
            <div
              key={option.id}
              className="flex items-center space-x-3 p-4 rounded-md border hover-elevate"
            >
              <Checkbox
                id={option.id}
                checked={currentAnswer.selectedOptions?.includes(option.id)}
                onCheckedChange={(checked) => {
                  const current = currentAnswer.selectedOptions || [];
                  const updated = checked
                    ? [...current, option.id]
                    : current.filter((id) => id !== option.id);
                  saveAnswer({ selectedOptions: updated });
                }}
                data-testid={`checkbox-${option.id}`}
              />
              <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                {option.optionText}
              </Label>
            </div>
          ))}
        </div>
      );
    }

    if (currentQuestion.questionType === "numeric") {
      return (
        <div className="space-y-2">
          <Label htmlFor="numeric-answer">Enter your answer</Label>
          <Input
            id="numeric-answer"
            type="text"
            placeholder="Enter numeric value"
            value={currentAnswer.numericAnswer || ""}
            onChange={(e) => saveAnswer({ numericAnswer: e.target.value })}
            className="max-w-md"
            data-testid="input-numeric-answer"
          />
        </div>
      );
    }

    if (currentQuestion.questionType === "true_false") {
      return (
        <RadioGroup
          value={currentAnswer.selectedOptions?.[0] || ""}
          onValueChange={(value) => saveAnswer({ selectedOptions: [value] })}
        >
          <div className="space-y-4">
            {currentQuestion.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 p-4 rounded-md border hover-elevate"
              >
                <RadioGroupItem value={option.id} id={option.id} data-testid={`option-${option.id}`} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.optionText}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Exam not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-semibold" data-testid="exam-title">{examData.title}</h1>
              <p className="text-sm text-muted-foreground">
                Total Marks: {examData.totalMarks}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                  timeRemaining < 300 ? "bg-destructive/10 border-destructive" : ""
                }`}
              >
                <Clock className="w-5 h-5" />
                <span
                  className={`font-mono ${timeRemaining < 300 ? "text-2xl font-bold" : "text-xl"}`}
                  data-testid="timer"
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowSubmitDialog(true)}
                data-testid="button-submit-exam"
              >
                Submit Exam
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {showWarning && (tabSwitchCount > 0 || focusLossCount > 0) && (
        <Alert variant="destructive" className="mx-4 md:mx-6 lg:mx-8 mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Warning: Tab switches detected ({tabSwitchCount}), Focus loss detected ({focusLossCount}).
            Your activity is being monitored.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8 lg:p-12">
                {currentQuestion && (
                  <>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          Question {currentQuestionIndex + 1} of {examData.questions.length}
                        </Badge>
                        <h2 className="text-lg font-medium">
                          Marks: {currentQuestion.marks}
                        </h2>
                      </div>
                      {getCurrentAnswer().isMarkedForReview && (
                        <Badge variant="secondary">Marked for Review</Badge>
                      )}
                    </div>

                    <div className="mb-8">
                      <p className="text-lg leading-relaxed" data-testid="question-text">
                        {currentQuestion.questionText}
                      </p>
                    </div>

                    <div className="mb-8">{renderQuestionContent()}</div>

                    {/* Navigation */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handlePrevious}
                          disabled={currentQuestionIndex === 0}
                          data-testid="button-previous"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleClear}
                          data-testid="button-clear"
                        >
                          Clear Response
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={handleMarkForReview}
                          data-testid="button-mark-review"
                        >
                          {getCurrentAnswer().isMarkedForReview
                            ? "Unmark Review"
                            : "Mark for Review"}
                        </Button>
                        <Button onClick={handleNext} data-testid="button-next">
                          Save & Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Question Palette */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Question Palette</h3>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-chart-2" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted" />
                    <span>Visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-chart-4" />
                    <span>Marked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border" />
                    <span>Not Visited</span>
                  </div>
                </div>

                {/* Question Numbers */}
                <div className="grid grid-cols-5 gap-2">
                  {examData.questions.map((q, index) => {
                    const status = getQuestionStatus(q.id);
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-10 h-10 rounded flex items-center justify-center text-sm font-medium transition-all hover-elevate ${getStatusColor(
                          status
                        )} ${currentQuestionIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
                        data-testid={`question-palette-${index + 1}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="mt-6 pt-6 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Answered:</span>
                    <span className="font-medium">
                      {Array.from(answers.values()).filter(
                        (a) => a.selectedOptions?.length || a.numericAnswer
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Not Answered:</span>
                    <span className="font-medium">
                      {examData.questions.length -
                        Array.from(answers.values()).filter(
                          (a) => a.selectedOptions?.length || a.numericAnswer
                        ).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marked for Review:</span>
                    <span className="font-medium">
                      {Array.from(answers.values()).filter((a) => a.isMarkedForReview).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your exam? You won't be able to make changes after
              submission.
            </AlertDialogDescription>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div>
                Answered:{" "}
                {
                  Array.from(answers.values()).filter(
                    (a) => a.selectedOptions?.length || a.numericAnswer
                  ).length
                }{" "}
                / {examData.questions.length}
              </div>
              <div>
                Marked for Review:{" "}
                {Array.from(answers.values()).filter((a) => a.isMarkedForReview).length}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submitExamMutation.mutate()}
              disabled={submitExamMutation.isPending}
              data-testid="button-confirm-submit"
            >
              {submitExamMutation.isPending ? "Submitting..." : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

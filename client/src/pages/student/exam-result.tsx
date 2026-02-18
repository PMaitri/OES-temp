import { useLocation, useParams } from "wouter";
import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

interface ExamResultData {
    exam: any;
    attempt: any;
    questions: any[];
}

export default function ExamResult() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();

    const { data, isLoading } = useQuery<ExamResultData>({
        queryKey: [`/api/student/exam/${id}/result`],
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <AppNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { exam, attempt, questions } = data;

    return (
        <div className="min-h-screen bg-background">
            <AppNavbar />
            <main className="max-w-5xl mx-auto px-4 py-8">
                <Button variant="outline" className="mb-6" onClick={() => setLocation("/student/dashboard")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                <div className="grid gap-6">
                    {/* Score Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Exam Result: {exam.title}</CardTitle>
                            <CardDescription>
                                Submitted on {new Date(attempt.submittedAt).toLocaleString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Score</p>
                                    <p className="text-3xl font-bold">{attempt.totalScore} / {exam.totalMarks}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Percentage</p>
                                    <p className="text-3xl font-bold">{attempt.percentage}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge className={attempt.isPassed ? "bg-green-600" : "bg-red-600"}>
                                        {attempt.isPassed ? "PASSED" : "FAILED"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions Review */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Review</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {questions.map((q: any, index: number) => {
                                let questionImage = "";
                                if (q.imageData) questionImage = q.imageData;
                                else if (q.questionText.startsWith("[IMAGE]")) questionImage = q.questionText.substring(7);

                                return (
                                    <div key={q.id} className={`border rounded-lg p-4 ${q.isCorrect ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">Q{index + 1}</span>
                                                {q.isCorrect ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>
                                            <span className="text-sm font-medium">
                                                {q.isCorrect ? `${q.marks}/${q.marks}` : `0/${q.marks}`} marks
                                            </span>
                                        </div>

                                        {questionImage ? (
                                            <img src={questionImage} alt="Question" className="max-h-64 rounded-lg border mb-4" />
                                        ) : (
                                            <p className="mb-4 font-medium">{q.questionText}</p>
                                        )}

                                        <div className="space-y-2">
                                            {q.questionType === "numeric" ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className={`p-3 rounded-md border ${q.isCorrect ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300"}`}>
                                                        <span className="text-sm font-semibold block mb-1">Your Answer</span>
                                                        <span className="text-lg">{q.studentAnswer !== undefined && q.studentAnswer !== null ? q.studentAnswer : "Not Answered"}</span>
                                                    </div>
                                                    <div className="p-3 rounded-md border bg-slate-100 border-slate-300">
                                                        <span className="text-sm font-semibold block mb-1">Correct Answer</span>
                                                        <span className="text-lg">{q.correctAnswer}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                q.options?.map((opt: any) => {
                                                    // Check if this option was selected by student
                                                    // In API we return studentAnswer as text. 
                                                    // But here we iterate options.
                                                    // Let's check matching text.
                                                    const isSelected = q.studentAnswer === opt.optionText;

                                                    let style = "border p-3 rounded-md flex justify-between items-center ";
                                                    if (opt.isCorrect) style += "bg-green-100 border-green-300 ";
                                                    else if (isSelected && !opt.isCorrect) style += "bg-red-100 border-red-300 ";
                                                    else style += "bg-background ";

                                                    return (
                                                        <div key={opt.id} className={style}>
                                                            <span>{opt.optionText}</span>
                                                            {isSelected && <span className="text-xs font-bold">(Your Answer)</span>}
                                                            {opt.isCorrect && <span className="text-xs font-bold text-green-700">(Correct)</span>}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

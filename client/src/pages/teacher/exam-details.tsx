import { useLocation } from "wouter";
import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";

interface ExamDetailsProps {
    params: { id: string };
}

export default function ExamDetails({ params }: ExamDetailsProps) {
    const [, setLocation] = useLocation();
    const examId = params.id;

    const { data: exam, isLoading } = useQuery<any>({
        queryKey: [`/api/teacher/exam/${examId}`],
        enabled: !!examId,
    });

    const { data: classes } = useQuery<any[]>({
        queryKey: ["/api/teacher/all-classes"],
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

    if (!exam) {
        return (
            <div className="min-h-screen bg-background">
                <AppNavbar />
                <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
                    <p className="text-xl font-semibold mb-4">Exam not found</p>
                    <Button onClick={() => setLocation("/teacher/exams")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Exams
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AppNavbar />

            <main className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
                <div className="mb-8 flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setLocation("/teacher/exams")}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setLocation("/teacher/dashboard")}>
                        Back to Dashboard
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{exam.title}</h1>
                        <p className="text-muted-foreground">
                            {exam.isPublished ? "Published Exam Details" : "Draft Exam Details"}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Exam Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Exam Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="font-medium">{exam.description || "No description"}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Duration</Label>
                                    <p className="font-medium">{exam.duration} minutes</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Scheduled Start</Label>
                                    <p className="font-medium">{new Date(exam.scheduledAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Scheduled End</Label>
                                    <p className="font-medium">{new Date(exam.endsAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Total Marks</Label>
                                    <p className="font-medium">{exam.totalMarks}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Passing Marks</Label>
                                    <p className="font-medium">{exam.passingMarks}</p>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-muted-foreground">Assigned Classes</Label>
                                    <p className="font-medium">
                                        {classes
                                            ?.filter((c) => exam.classIds?.includes(c.id) || c.id === exam.classId)
                                            .map((c) => `${c.name}${c.section ? ` - ${c.section}` : ""}`)
                                            .join(", ") || "None"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Questions ({exam.questions.length})</CardTitle>
                            <CardDescription>Review the questions in this exam</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {exam.questions.map((q: any, index: number) => {
                                let questionImage = "";
                                if (q.imageData) {
                                    questionImage = q.imageData;
                                } else if (q.questionText.startsWith("[IMAGE]")) {
                                    questionImage = q.questionText.substring(7);
                                }
                                const correctOption = q.options.find((o: any) => o.isCorrect);

                                return (
                                    <div key={q.id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">Q{index + 1}</span>
                                                <span className="text-xs bg-secondary px-2 py-1 rounded">
                                                    {q.marks} mark{q.marks > 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        </div>

                                        {questionImage && (
                                            <div className="mb-4">
                                                <img
                                                    src={questionImage}
                                                    alt={`Question ${index + 1}`}
                                                    className="max-h-64 rounded-lg border"
                                                />
                                            </div>
                                        )}

                                        {!questionImage && (
                                            <p className="mb-4 font-medium">{q.questionText}</p>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {q.options.map((opt: any, optIndex: number) => (
                                                <div
                                                    key={opt.id}
                                                    className={`p-3 rounded-md border flex items-center gap-2 ${opt.isCorrect ? "bg-green-50 border-green-200" : "bg-background"
                                                        }`}
                                                >
                                                    <span className={`font-bold ${opt.isCorrect ? "text-green-700" : ""}`}>
                                                        {String.fromCharCode(65 + optIndex)}
                                                    </span>
                                                    <span className={opt.isCorrect ? "text-green-700 font-medium" : ""}>
                                                        {opt.optionText || (opt.isCorrect ? "Correct Answer" : "Option")}
                                                    </span>
                                                    {opt.isCorrect && (
                                                        <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                                            Correct
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
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

import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface Student {
    id: string;
    fullName: string;
    email: string;
    username: string;
    className: string;
    section: string;
    rollNumber: number;
    totalExamsTaken: number;
    averageScore: string;
}

interface ExamAttempt {
    id: string;
    examTitle: string;
    totalScore: number;
    maxScore: number;
    startedAt: string;
    submittedAt: string;
    isSubmitted: boolean;
}

export default function StudentDetails({ params }: { params: { id: string } }) {
    const [_, setLocation] = useLocation();
    const studentId = params.id;

    // Fetch student details (we might need a specific endpoint for single student or filter from list)
    // For now, let's fetch the list and find the student, or add a new endpoint.
    // Given the previous code, we fetched all students. Let's try to fetch all and find, 
    // or better, let's assume we can get student details. 
    // Actually, looking at routes.ts, we don't have a specific "get student by id for teacher" endpoint 
    // that returns the profile. But we can use the list endpoint or add one.
    // To be safe and quick, let's use the list endpoint and filter, 
    // but a dedicated endpoint would be better for performance.
    // However, the user just wants the page. Let's use the existing list endpoint for now to get student info.

    const { data: students = [] } = useQuery<Student[]>({
        queryKey: ["/api/teacher/students"],
    });

    const student = students.find(s => s.id === studentId);

    const { data: attempts = [], isLoading: isLoadingAttempts } = useQuery<ExamAttempt[]>({
        queryKey: ["/api/teacher/students", studentId, "attempts"],
        queryFn: async () => {
            if (!studentId) return [];
            const res = await fetch(`/api/teacher/students/${studentId}/attempts`);
            if (!res.ok) throw new Error("Failed to fetch attempts");
            return res.json();
        },
        enabled: !!studentId,
    });

    if (!student) {
        return (
            <div className="min-h-screen bg-background">
                <AppNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AppNavbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:pl-2 transition-all"
                    onClick={() => setLocation("/teacher/students")}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Students
                </Button>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Student Profile Card */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle>Student Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg mb-4">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                    <span className="text-2xl font-bold text-primary">
                                        {student.rollNumber || "#"}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-center">{student.fullName}</h2>
                                <p className="text-muted-foreground">{student.email}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Class</span>
                                    <span className="font-medium">{student.className} - {student.section}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Roll Number</span>
                                    <span className="font-medium">{student.rollNumber || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Exams Taken</span>
                                    <span className="font-medium">{student.totalExamsTaken}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Average Score</span>
                                    <span className="font-medium">{student.averageScore}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Exam History */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Exam History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingAttempts ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                </div>
                            ) : attempts.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No exams taken yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {attempts.map((attempt) => (
                                        <div
                                            key={attempt.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="mb-2 sm:mb-0">
                                                <h3 className="font-semibold text-lg">{attempt.examTitle}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Taken on {format(new Date(attempt.startedAt), "PPP p")}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right mr-2">
                                                    {attempt.isSubmitted ? (
                                                        <>
                                                            <div className="text-2xl font-bold text-primary">
                                                                {attempt.totalScore}
                                                                <span className="text-sm text-muted-foreground font-normal ml-1">
                                                                    / {attempt.maxScore}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">Score</div>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">Not graded</span>
                                                    )}
                                                </div>
                                                <Badge
                                                    variant={attempt.isSubmitted ? "default" : "secondary"}
                                                    className="h-fit"
                                                >
                                                    {attempt.isSubmitted ? "Completed" : "In Progress"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

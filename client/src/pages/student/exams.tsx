import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Calendar, Clock, FileText, ArrowLeft } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";

interface Exam {
    id: string;
    title: string;
    description: string;
    classId: string;
    duration: number;
    totalMarks: number;
    scheduledAt: string;
    endsAt: string;
    isSubmitted?: boolean;
    isPublished: boolean;
}

export default function StudentExams() {
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();

    const { data: exams = [], isLoading } = useQuery<Exam[]>({
        queryKey: ["/api/student/exams"],
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const availableExams = exams.filter(e => new Date(e.endsAt) > new Date() && !e.isSubmitted);

    return (
        <div className="min-h-screen bg-background">
            <AppNavbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        className="mb-4 pl-0 hover:pl-2 transition-all"
                        onClick={() => setLocation("/student/dashboard")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold">Available Exams</h1>
                    <p className="text-muted-foreground mt-1">
                        View and take your upcoming exams
                    </p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="h-32 bg-muted/50" />
                                <CardContent className="h-32" />
                            </Card>
                        ))}
                    </div>
                ) : availableExams.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Exams Available</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-sm">
                                There are currently no exams scheduled for your classes. Please check back later or contact your teacher.
                            </p>
                            <Button onClick={() => setLocation("/student/dashboard")}>
                                Return to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableExams.map((exam) => (
                            <Card key={exam.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <CountdownTimer
                                            targetDate={exam.scheduledAt}
                                            onComplete={() => queryClient.invalidateQueries({ queryKey: ["/api/student/exams"] })}
                                            fallback={
                                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                                    Available
                                                </Badge>
                                            }
                                        />
                                        <span className="text-sm text-muted-foreground flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {exam.duration} mins
                                        </span>
                                    </div>
                                    <CardTitle className="line-clamp-2">{exam.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {exam.description || "No description provided"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mt-auto pt-0">
                                    <div className="space-y-4">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {formatDate(exam.scheduledAt)} - {formatDate(exam.endsAt)}
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <span className="font-semibold">
                                                {exam.totalMarks} Marks
                                            </span>
                                            <Button
                                                onClick={() => setLocation(`/student/take-exam/${exam.id}`)}
                                                disabled={new Date(exam.scheduledAt) > new Date()}
                                            >
                                                Start Exam
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

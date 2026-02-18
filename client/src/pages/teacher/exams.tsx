import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Eye, CheckCircle, Clock, Upload, Loader2, Calendar, Users, ArrowLeft } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";

interface Exam {
    id: string;
    title: string;
    description: string;
    classId: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    isPublished: boolean;
    status: string;
    scheduledAt: string;
    endsAt: string;
    createdAt: string;
    classNames?: string[];
}

interface Class {
    id: string;
    name: string;
    section: string;
}

export default function TeacherExams() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const { data: exams = [], isLoading } = useQuery<Exam[]>({
        queryKey: ["/api/teacher/exams"],
    });

    const { data: classes = [] } = useQuery<Class[]>({
        queryKey: ["/api/teacher/all-classes"],
    });

    const publishExamMutation = useMutation({
        mutationFn: async (examId: string) => {
            return apiRequest("PUT", `/api/teacher/exam/${examId}/publish`, {});
        },
        onSuccess: () => {
            toast({
                title: "Exam published successfully",
                description: "Students can now see and take this exam",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/teacher/exams"] });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Failed to publish exam",
                description: error.message || "Please try again",
            });
        },
    });

    const getClassName = (exam: Exam) => {
        if (exam.classNames && exam.classNames.length > 0) {
            return exam.classNames.join(", ");
        }
        const cls = classes.find(c => c.id === exam.classId);
        return cls ? `${cls.name} - ${cls.section}` : "Unknown Class";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const draftExams = exams.filter(e => !e.isPublished);
    const publishedExams = exams.filter(e => e.isPublished);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <AppNavbar />
                <main className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AppNavbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <Button variant="outline" size="icon" onClick={() => setLocation("/teacher/dashboard")}>
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <h1 className="text-3xl font-bold">My Exams</h1>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Manage and publish your exams
                        </p>
                    </div>
                    <Button onClick={() => setLocation("/teacher/exams/create")} size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Create New Exam
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{exams.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Published</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{publishedExams.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{draftExams.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {exams.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-12">
                                <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No exams created yet</h3>
                                <p className="text-muted-foreground mb-6">
                                    Create your first exam to get started
                                </p>
                                <Button onClick={() => setLocation("/teacher/exams/create")}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Exam
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Draft Exams */}
                        {draftExams.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-yellow-600" />
                                    Draft Exams ({draftExams.length})
                                </h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {draftExams.map((exam) => (
                                        <Card key={exam.id} className="border-l-4 border-l-yellow-500">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-xl">{exam.title}</CardTitle>
                                                        <CardDescription className="mt-2">
                                                            {exam.description || "No description"}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Draft
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Class</p>
                                                        <p className="font-medium">{getClassName(exam)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Duration</p>
                                                        <p className="font-medium">{exam.duration} mins</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Total Marks</p>
                                                        <p className="font-medium">{exam.totalMarks}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Scheduled</p>
                                                        <p className="font-medium">{formatDate(exam.scheduledAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => publishExamMutation.mutate(exam.id)}
                                                        disabled={publishExamMutation.isPending}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {publishExamMutation.isPending ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                Publishing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-4 h-4 mr-2" />
                                                                Publish Exam
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button variant="outline" onClick={() => setLocation(`/teacher/exams/edit/${exam.id}`)}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Edit Exam
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Published Exams */}
                        {publishedExams.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Published Exams ({publishedExams.length})
                                </h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {publishedExams.map((exam) => (
                                        <Card key={exam.id} className="border-l-4 border-l-green-500">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-xl">{exam.title}</CardTitle>
                                                        <CardDescription className="mt-2">
                                                            {exam.description || "No description"}
                                                        </CardDescription>
                                                    </div>
                                                    <CountdownTimer
                                                        targetDate={exam.scheduledAt}
                                                        fallback={
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Published
                                                            </Badge>
                                                        }
                                                    />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Class</p>
                                                        <p className="font-medium">{getClassName(exam)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Duration</p>
                                                        <p className="font-medium">{exam.duration} mins</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Total Marks</p>
                                                        <p className="font-medium">{exam.totalMarks}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Scheduled</p>
                                                        <p className="font-medium">{formatDate(exam.scheduledAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button variant="outline" onClick={() => setLocation(`/teacher/exams/details/${exam.id}`)}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                    <Button variant="outline">
                                                        <Users className="w-4 h-4 mr-2" />
                                                        View Results
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

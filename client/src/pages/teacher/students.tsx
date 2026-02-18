import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, User, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function TeacherStudents() {
    const [_, setLocation] = useLocation();

    const { data: students = [], isLoading, error } = useQuery<Student[]>({
        queryKey: ["/api/teacher/students"],
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

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <AppNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <p className="text-destructive">Error loading students: {(error as Error).message}</p>
                </div>
            </div>
        );
    }

    // Group students by class and section
    const groupedStudents = students.reduce((acc, student) => {
        const key = `${student.className} - ${student.section}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(student);
        return acc;
    }, {} as Record<string, Student[]>);

    // Sort class names
    const sortedClasses = Object.keys(groupedStudents).sort();

    // Sort students within each class by roll number
    sortedClasses.forEach(className => {
        groupedStudents[className].sort((a, b) => (a.rollNumber || 0) - (b.rollNumber || 0));
    });

    return (
        <div className="min-h-screen bg-background">
            <AppNavbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        className="mb-4 pl-0 hover:pl-2 transition-all"
                        onClick={() => setLocation("/teacher/dashboard")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold">My Students</h1>
                    <p className="text-muted-foreground mt-1">
                        View performance of students in your assigned classes
                    </p>
                </div>

                {sortedClasses.length === 0 ? (
                    <Card>
                        <CardContent className="py-8">
                            <p className="text-center text-muted-foreground">
                                No students found in your assigned classes.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {sortedClasses.map((className) => (
                            <Card key={className}>
                                <CardHeader className="bg-muted/50">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        Class {className}
                                        <Badge variant="secondary" className="ml-2">
                                            {groupedStudents[className].length} Students
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        {groupedStudents[className].map((student) => (
                                            <div
                                                key={student.id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="font-bold text-primary">
                                                            {student.rollNumber || "#"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{student.fullName}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Roll No: {student.rollNumber || "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right hidden sm:block">
                                                        <div className="text-sm font-medium">
                                                            Exams: {student.totalExamsTaken}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Avg: {student.averageScore}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setLocation(`/teacher/students/${student.id}`)}
                                                    >
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Details
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
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

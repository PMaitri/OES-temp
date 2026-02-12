import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
interface Stats {
  totalClasses: number;
  totalExams: number;
  completedExams: number;
  pendingExams: number;
}
// ...
import { BookOpen, FileText, CheckCircle, Clock, Calendar, Award } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";

interface Class {
  id: string;
  name: string;
  section: string;
  rollNumber?: number;
}

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

interface Result {
  id: string;
  examId: string;
  totalScore: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
  exam: Exam;
}

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/student/stats"],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/student/classes"],
  });

  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ["/api/student/exams"],
  });

  const { data: results = [] } = useQuery<Result[]>({
    queryKey: ["/api/student/results"],
  });

  const upcomingExams = exams.filter(e => new Date(e.endsAt) > new Date() && !e.isSubmitted).slice(0, 5);
  const recentResults = results.slice(0, 3);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">View your classes and exams</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
              <p className="text-xs text-muted-foreground">Enrolled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalExams || 0}</div>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedExams || 0}</div>
              <p className="text-xs text-muted-foreground">Exams taken</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingExams || 0}</div>
              <p className="text-xs text-muted-foreground">To complete</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Classes */}
          <Card>
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Classes you are enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No classes enrolled yet
                </p>
              ) : (
                <div className="space-y-3">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-sm text-muted-foreground">Section {cls.section}</p>
                          {cls.rollNumber && (
                            <p className="text-xs font-semibold text-primary mt-1">
                              Roll No: {cls.rollNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Exams */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Exams</CardTitle>
                  <CardDescription>Published exams for your classes</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setLocation("/student/exams")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingExams.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No upcoming exams</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setLocation(`/student/take-exam/${exam.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{exam.title}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {formatDate(exam.scheduledAt)} - {formatDate(exam.endsAt)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {exam.duration} mins
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {exam.totalMarks} marks
                            </span>
                          </div>
                        </div>
                        <CountdownTimer
                          targetDate={exam.scheduledAt}
                          onComplete={() => queryClient.invalidateQueries({ queryKey: ["/api/student/exams"] })}
                          fallback={
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Available
                            </Badge>
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Results</CardTitle>
                  <CardDescription>Your latest exam scores</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setLocation("/student/results")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentResults.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No results yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete an exam to see your results here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setLocation(`/student/exam-result/${result.examId}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{result.exam?.title || "Exam"}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Submitted on {formatDate(result.submittedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold">
                              {result.percentage}%
                            </div>
                            {result.isPassed ? (
                              <Badge className="bg-green-600">Passed</Badge>
                            ) : (
                              <Badge variant="destructive">Failed</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {result.totalScore} / {result.exam?.totalMarks || 0} marks
                          </p>
                        </div>
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

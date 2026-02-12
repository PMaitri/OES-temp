import { useAuth } from "@/lib/auth";
import { AppNavbar } from "@/components/app-navbar";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users, FileText, TrendingUp, Plus, Calendar, Edit } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface TeacherStats {
  totalExams: number;
  totalStudents: number;
  totalQuestions: number;
  activeExams: number;
}

interface ExamCard {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  totalMarks: number;
  status: string;
  className: string;
  studentCount: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<TeacherStats>({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: recentExams, isLoading: examsLoading } = useQuery<ExamCard[]>({
    queryKey: ["/api/teacher/exams/recent"],
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: "default",
      scheduled: "secondary",
      draft: "outline",
      completed: "outline",
    };
    return variants[status] || "outline";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Welcome, {user?.fullName}!</h1>
            <p className="text-muted-foreground">Manage your exams and track student performance</p>
          </div>
          <Link href="/teacher/exams/create">
            <Button data-testid="button-create-exam">
              <Plus className="w-4 h-4 mr-2" />
              Create Exam
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Total Exams"
                value={stats?.totalExams || 0}
                icon={BookOpen}
                iconBgColor="bg-primary/10"
                iconColor="text-primary"
              />
              <StatCard
                title="Total Students"
                value={stats?.totalStudents || 0}
                icon={Users}
                iconBgColor="bg-chart-2/10"
                iconColor="text-chart-2"
              />
              <StatCard
                title="Question Bank"
                value={stats?.totalQuestions || 0}
                icon={FileText}
                iconBgColor="bg-chart-3/10"
                iconColor="text-chart-3"
              />
              <StatCard
                title="Active Exams"
                value={stats?.activeExams || 0}
                icon={TrendingUp}
                iconBgColor="bg-chart-4/10"
                iconColor="text-chart-4"
              />
            </>
          )}
        </div>

        {/* Recent Exams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Exams</CardTitle>
                <CardDescription>Your recently created and scheduled exams</CardDescription>
              </div>
              <Link href="/teacher/exams">
                <Button variant="outline" size="sm" data-testid="button-view-all-exams">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {examsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : recentExams && recentExams.length > 0 ? (
              <div className="space-y-4">
                {recentExams.map((exam) => (
                  <Card key={exam.id} className="hover-elevate">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <h3 className="font-medium flex-1" data-testid={`exam-title-${exam.id}`}>
                              {exam.title}
                            </h3>
                            <Badge variant={getStatusBadge(exam.status)}>
                              {exam.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(exam.scheduledAt), "MMM dd, yyyy")}
                            </span>
                            <span>{exam.duration} mins</span>
                            <span>{exam.totalMarks} marks</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {exam.studentCount} students
                            </span>
                            <span className="text-primary">{exam.className}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/teacher/exams/${exam.id}/edit`}>
                            <Button variant="outline" size="sm" data-testid={`button-edit-${exam.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/teacher/exams/${exam.id}/analytics`}>
                            <Button variant="outline" size="sm" data-testid={`button-analytics-${exam.id}`}>
                              <TrendingUp className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No exams created yet</p>
                <Link href="/teacher/exams/create">
                  <Button data-testid="button-create-first-exam">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Exam
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link href="/teacher/questions">
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Question Bank</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your question library
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/teacher/classes">
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-chart-2" />
                <h3 className="font-semibold mb-2">Classes</h3>
                <p className="text-sm text-muted-foreground">
                  View and manage your classes
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/teacher/analytics">
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-chart-3" />
                <h3 className="font-semibold mb-2">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  View performance insights
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}

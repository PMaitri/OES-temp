import { useAuth } from "@/lib/auth";
import { AppNavbar } from "@/components/app-navbar";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, TrendingUp, Trophy, Calendar, Play, FileText } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ExamCard {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  totalMarks: number;
  status: string;
}

interface DashboardStats {
  totalExams: number;
  completedExams: number;
  averageScore: number;
  upcomingExams: number;
}

interface PerformanceData {
  examTitle: string;
  score: number;
  percentage: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/student/stats"],
  });

  const { data: upcomingExams, isLoading: examsLoading } = useQuery<ExamCard[]>({
    queryKey: ["/api/student/exams/upcoming"],
  });

  const { data: recentResults, isLoading: resultsLoading } = useQuery<PerformanceData[]>({
    queryKey: ["/api/student/results/recent"],
  });

  const getStatusColor = (status: string) => {
    if (status === "scheduled") return "border-l-primary";
    if (status === "active") return "border-l-chart-2";
    return "border-l-muted";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Welcome back, {user?.fullName}!</h1>
          <p className="text-muted-foreground">Here's your academic performance overview</p>
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
                title="Completed"
                value={stats?.completedExams || 0}
                icon={Trophy}
                iconBgColor="bg-chart-2/10"
                iconColor="text-chart-2"
              />
              <StatCard
                title="Average Score"
                value={`${stats?.averageScore || 0}%`}
                icon={TrendingUp}
                iconBgColor="bg-chart-3/10"
                iconColor="text-chart-3"
              />
              <StatCard
                title="Upcoming"
                value={stats?.upcomingExams || 0}
                icon={Clock}
                iconBgColor="bg-chart-4/10"
                iconColor="text-chart-4"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upcoming Exams */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Exams</CardTitle>
              <CardDescription>Your scheduled assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {examsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : upcomingExams && upcomingExams.length > 0 ? (
                <div className="space-y-4">
                  {upcomingExams.map((exam) => (
                    <Card key={exam.id} className={`border-l-4 ${getStatusColor(exam.status)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-medium mb-1" data-testid={`exam-title-${exam.id}`}>
                              {exam.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(exam.scheduledAt), "MMM dd, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {exam.duration} mins
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {exam.totalMarks} marks
                              </span>
                            </div>
                          </div>
                          {exam.status === "active" && (
                            <Link href={`/student/exam/${exam.id}`}>
                              <Button size="sm" data-testid={`button-start-exam-${exam.id}`}>
                                <Play className="w-4 h-4 mr-1" />
                                Start
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No upcoming exams scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Performance</CardTitle>
              <CardDescription>Your scores from recent exams</CardDescription>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : recentResults && recentResults.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={recentResults}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="examTitle"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No performance data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/student/exams">
              <Button variant="outline" data-testid="button-view-all-exams">
                <BookOpen className="w-4 h-4 mr-2" />
                View All Exams
              </Button>
            </Link>
            <Link href="/student/results">
              <Button variant="outline" data-testid="button-view-results">
                <Trophy className="w-4 h-4 mr-2" />
                View Results
              </Button>
            </Link>
            <Link href="/student/analytics">
              <Button variant="outline" data-testid="button-performance-analytics">
                <TrendingUp className="w-4 h-4 mr-2" />
                Performance Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

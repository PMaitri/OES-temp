import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BookOpen, Users, FileText, Plus, Eye, CheckCircle, Clock } from "lucide-react";

interface Stats {
  totalClasses: number;
  totalExams: number;
  totalStudents: number;
}

interface Class {
  id: string;
  name: string;
  section: string;
  subjectName?: string;
}

interface Exam {
  id: string;
  title: string;
  classId: string;
  duration: number;
  totalMarks: number;
  isPublished: boolean;
  status: string;
  scheduledAt: string;
}

export default function TeacherDashboard() {
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/teacher/classes"],
  });

  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ["/api/teacher/exams"],
  });

  const recentExams = exams.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your classes and exams</p>
          </div>
          <Button onClick={() => setLocation("/teacher/exams/create")} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Exam
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
              <p className="text-xs text-muted-foreground">Assigned to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalExams || 0}</div>
              <p className="text-xs text-muted-foreground">Created by you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">In your classes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Classes */}
          <Card>
            <CardHeader>
              <CardTitle>My Assigned Classes</CardTitle>
              <CardDescription>Classes you are teaching</CardDescription>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No classes assigned yet
                </p>
              ) : (
                <div className="space-y-3">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Section {cls.section}
                            {cls.subjectName && ` • ${cls.subjectName}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Exams */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Exams</CardTitle>
                  <CardDescription>Your latest created exams</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setLocation("/teacher/exams")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentExams.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No exams created yet</p>
                  <Button onClick={() => setLocation("/teacher/exams/create")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Exam
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{exam.title}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {exam.duration} mins
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {exam.totalMarks} marks
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {exam.isPublished ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setLocation("/teacher/exams/create")}
              >
                <Plus className="w-6 h-6" />
                <span>Create New Exam</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setLocation("/teacher/exams")}
              >
                <FileText className="w-6 h-6" />
                <span>View All Exams</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setLocation("/teacher/students")}
              >
                <Users className="w-6 h-6" />
                <span>View Students</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { useAuth } from "@/lib/auth";
import { AppNavbar } from "@/components/app-navbar";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Users, GraduationCap, BookOpen, School, Plus } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalExams: number;
  totalClasses: number;
}

interface ActivityData {
  date: string;
  exams: number;
  students: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<ActivityData[]>({
    queryKey: ["/api/admin/activity"],
  });

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.fullName}! Manage your school system</p>
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
                title="Total Students"
                value={stats?.totalStudents || 0}
                icon={GraduationCap}
                iconBgColor="bg-primary/10"
                iconColor="text-primary"
              />
              <StatCard
                title="Total Teachers"
                value={stats?.totalTeachers || 0}
                icon={Users}
                iconBgColor="bg-chart-2/10"
                iconColor="text-chart-2"
              />
              <StatCard
                title="Total Exams"
                value={stats?.totalExams || 0}
                icon={BookOpen}
                iconBgColor="bg-chart-3/10"
                iconColor="text-chart-3"
              />
              <StatCard
                title="Total Classes"
                value={stats?.totalClasses || 0}
                icon={School}
                iconBgColor="bg-chart-4/10"
                iconColor="text-chart-4"
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>Recent activity trends</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : activityData && activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Line type="monotone" dataKey="exams" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="students" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/users/create">
                <Button variant="outline" className="w-full justify-start" data-testid="button-add-user">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New User
                </Button>
              </Link>
              <Link href="/admin/classes/create">
                <Button variant="outline" className="w-full justify-start" data-testid="button-add-class">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Class
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full justify-start" data-testid="button-settings">
                  <School className="w-4 h-4 mr-2" />
                  System Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/users">
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage students, teachers, and admin accounts
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/classes">
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="p-6 text-center">
                <School className="w-12 h-12 mx-auto mb-4 text-chart-2" />
                <h3 className="font-semibold mb-2">Class Management</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage classes and enrollments
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/analytics">
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-chart-3" />
                <h3 className="font-semibold mb-2">System Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  View comprehensive system reports
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}

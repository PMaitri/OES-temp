import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/protected-route";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Unauthorized from "@/pages/unauthorized";
import NotFound from "@/pages/not-found";

// Student Pages
import StudentDashboard from "@/pages/student/dashboard";
import StudentExam from "@/pages/student/exam";
import StudentResults from "@/pages/student/results";

// Teacher Pages
import TeacherDashboard from "@/pages/teacher/dashboard";
import CreateExam from "@/pages/teacher/create-exam";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";

function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  // Redirect based on role
  if (user.role === "student") {
    return <Redirect to="/student/dashboard" />;
  } else if (user.role === "teacher") {
    return <Redirect to="/teacher/dashboard" />;
  } else if (user.role === "admin") {
    return <Redirect to="/admin/dashboard" />;
  }

  return <Redirect to="/login" />;
}

function Router() {
  return (
    <Switch>
      {/* Root redirect */}
      <Route path="/" component={RootRedirect} />

      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/unauthorized" component={Unauthorized} />

      {/* Student routes */}
      <Route path="/student/dashboard">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/student/exam/:id">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentExam />
        </ProtectedRoute>
      </Route>
      <Route path="/student/results">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentResults />
        </ProtectedRoute>
      </Route>

      {/* Teacher routes */}
      <Route path="/teacher/dashboard">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/exams/create">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <CreateExam />
        </ProtectedRoute>
      </Route>

      {/* Admin routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminUsers />
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

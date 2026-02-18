import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { queryClient } from "./queryClient";

interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  role: "student" | "teacher" | "admin" | "organization";
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string, role: string) => Promise<void>;
  register: (data: {
    username: string;
    email?: string;
    password: string;
    fullName: string;
    role: string;
    studentId?: string;
    classId?: string;
    rollNumber?: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string, role: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();

    // Validate that the returned user role matches the selected role
    if (data.user.role !== role) {
      throw new Error(`Role mismatch: You cannot login as ${role}`);
    }

    // Clear any existing cache to prevent data leakage
    queryClient.clear();

    setUser(data.user);

    // Redirect based on role
    if (data.user.role === "student") {
      setLocation("/student/dashboard");
    } else if (data.user.role === "teacher") {
      setLocation("/teacher/dashboard");
    } else if (data.user.role === "admin") {
      setLocation("/admin/dashboard");
    } else if (data.user.role === "organization") {
      setLocation("/organization/dashboard");
    }
  };

  const register = async (data: { username: string; email?: string; password: string; fullName: string; role: string }) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const result = await response.json();

    // Clear any existing cache to prevent data leakage
    queryClient.clear();

    setUser(result.user);

    // Redirect based on role
    if (result.user.role === "student") {
      setLocation("/student/dashboard");
    } else if (result.user.role === "teacher") {
      setLocation("/teacher/dashboard");
    } else if (result.user.role === "admin") {
      setLocation("/admin/dashboard");
    } else if (result.user.role === "organization") {
      setLocation("/organization/dashboard");
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    // Clear cache on logout
    queryClient.clear();

    setUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

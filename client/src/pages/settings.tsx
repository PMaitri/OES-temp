import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Class {
    id: string;
    name: string;
    section: string;
    rollNumber: number;
}

export default function Settings() {
    const { user } = useAuth();
    const { toast } = useToast();

    const { data: studentClasses } = useQuery<Class[]>({
        queryKey: ["/api/student/classes"],
        enabled: user?.role === "student",
    });

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiRequest("POST", "/api/auth/change-password", data);
        },
        onSuccess: () => {
            toast({
                title: "Password updated",
                description: "Your password has been changed successfully.",
            });
            setPasswords({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Failed to update password",
                description: error.message || "Please try again",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast({
                variant: "destructive",
                title: "Passwords do not match",
                description: "New password and confirm password must match",
            });
            return;
        }

        if (passwords.newPassword.length < 6) {
            toast({
                variant: "destructive",
                title: "Password too short",
                description: "Password must be at least 6 characters",
            });
            return;
        }

        changePasswordMutation.mutate({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword,
        });
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <AppNavbar />
            <main className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-muted-foreground">Manage your account preferences</p>
                </div>

                <div className="grid gap-6">
                    {user.role === "student" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Academic Details</CardTitle>
                                <CardDescription>Your current class and roll number</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Class</Label>
                                        <p className="font-medium text-lg">
                                            {studentClasses && studentClasses.length > 0
                                                ? `${studentClasses[0].name} ${studentClasses[0].section ? `- ${studentClasses[0].section}` : ''}`
                                                : "Not enrolled"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Roll Number</Label>
                                        <p className="font-medium text-lg">
                                            {studentClasses && studentClasses.length > 0
                                                ? studentClasses[0].rollNumber || "N/A"
                                                : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your password to keep your account secure</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        value={passwords.currentPassword}
                                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                <Button type="submit" disabled={changePasswordMutation.isPending}>
                                    {changePasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Update Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

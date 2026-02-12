import { useAuth } from "@/lib/auth";
import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";

interface Class {
    id: string;
    name: string;
    section: string;
    rollNumber: number;
}

export default function Profile() {
    const { user } = useAuth();

    // Fetch class details if student
    const { data: studentClasses } = useQuery<Class[]>({
        queryKey: ["/api/student/classes"],
        enabled: user?.role === "student",
    });

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <AppNavbar />
            <main className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                    <p className="text-muted-foreground">Manage your personal information</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Full Name</Label>
                                <p className="font-medium text-lg">{user.fullName}</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Email Address</Label>
                                <p className="font-medium text-lg">{user.email}</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Username</Label>
                                <p className="font-medium text-lg">{user.username}</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Role</Label>
                                <p className="font-medium text-lg capitalize">{user.role}</p>
                            </div>

                            {user.role === "student" && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Enrolled Class</Label>
                                        <p className="font-medium text-lg">
                                            {studentClasses && studentClasses.length > 0
                                                ? `${studentClasses[0].name} ${studentClasses[0].section ? `- ${studentClasses[0].section}` : ''}`
                                                : "Not enrolled"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Roll Number</Label>
                                        <p className="font-medium text-lg">
                                            {studentClasses && studentClasses.length > 0
                                                ? studentClasses[0].rollNumber || "N/A"
                                                : "N/A"}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

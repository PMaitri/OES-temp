import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, School, Users, UserCheck, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppNavbar } from "@/components/app-navbar";

interface OrganizationStats {
    totalInstitutes: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
}

interface Institute {
    id: string;
    name: string;
    description: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
    isActive: boolean;
    createdAt: string;
}

interface Organization {
    id: string;
    name: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    logo: string;
    isActive: boolean;
    createdAt: string;
}

export default function OrganizationDashboard() {
    const { user } = useAuth();

    const { data: stats } = useQuery<OrganizationStats>({
        queryKey: ["/api/organization/stats"],
    });

    const { data: institutes } = useQuery<Institute[]>({
        queryKey: ["/api/organization/institutes"],
    });

    const { data: organization } = useQuery<Organization>({
        queryKey: ["/api/organization/details"],
    });

    return (
        <div className="min-h-screen bg-background">
            <AppNavbar />

            <main className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user?.fullName}! Manage your institutes and monitor performance.
                    </p>
                </div>

                {/* Organization Details */}
                {organization && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                {organization.name}
                            </CardTitle>
                            <CardDescription>{organization.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium">Contact Email</p>
                                <p className="text-sm text-muted-foreground">{organization.contactEmail}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Contact Phone</p>
                                <p className="text-sm text-muted-foreground">{organization.contactPhone || "N/A"}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm font-medium">Address</p>
                                <p className="text-sm text-muted-foreground">{organization.address || "N/A"}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Institutes</CardTitle>
                            <School className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalInstitutes || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Schools and colleges under management
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Across all institutes
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Teaching staff members
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalAdmins || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Administrative staff
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Institutes List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Managed Institutes</CardTitle>
                        <CardDescription>
                            All schools and colleges under your organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {institutes && institutes.length > 0 ? (
                            <div className="space-y-4">
                                {institutes.map((institute) => (
                                    <div
                                        key={institute.id}
                                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <School className="w-4 h-4 text-primary" />
                                                <h3 className="font-semibold">{institute.name}</h3>
                                                {institute.isActive && (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{institute.description}</p>
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                {institute.address && <p>📍 {institute.address}</p>}
                                                {institute.contactEmail && <p>✉️ {institute.contactEmail}</p>}
                                                {institute.contactPhone && <p>📞 {institute.contactPhone}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <School className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No institutes found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

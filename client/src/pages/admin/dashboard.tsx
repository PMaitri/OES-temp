import { useState, useEffect } from "react";
import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, BookOpen, GraduationCap, BookMarked, Plus, Loader2, Trash2, Info, ShieldCheck, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Eye, EyeOff } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalAdmins: number;
}

interface Class {
  id: string;
  name: string;
  section: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  fullName: string;
  email: string;
  username: string; // Added username
}

interface Student {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  username: string;
  className?: string;
  section?: string;
  rollNumber?: number;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();

  // Fetch data
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/admin/classes"],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/admin/subjects"],
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ["/api/admin/teachers"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
  });

  const { data: adminUsers = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/list-admins"],
  });

  const { data: assignments = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/teacher-assignments"],
  });

  // Form states
  const [classForm, setClassForm] = useState({ name: "", section: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "", classId: "" });
  const [teacherForm, setTeacherForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
  });
  const [studentForm, setStudentForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    studentId: "",
  });
  const [assignTeacherForm, setAssignTeacherForm] = useState<{
    teacherId: string;
    classIds: string[];
    subjectId: string;
  }>({
    teacherId: "",
    classIds: [],
    subjectId: "",
  });
  const [openClassSelect, setOpenClassSelect] = useState(false);
  const [enrollStudentForm, setEnrollStudentForm] = useState({
    studentId: "",
    classId: "",
    rollNumber: "",
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editTeacherName, setEditTeacherName] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [searchTeacher, setSearchTeacher] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [editStudentId, setEditStudentId] = useState("");
  const [editStudentRoll, setEditStudentRoll] = useState("");
  const [editStudentName, setEditStudentName] = useState("");
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedTeacher) {
      setEditTeacherName(selectedTeacher.fullName);
    }
    if (selectedStudent) {
      setEditStudentId(selectedStudent.studentId || "");
      setEditStudentRoll(selectedStudent.rollNumber ? String(selectedStudent.rollNumber) : "");
      setEditStudentName(selectedStudent.fullName || "");
    }
  }, [selectedTeacher, selectedStudent]);

  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: async (data: typeof classForm) => {
      return apiRequest("POST", "/api/admin/classes", data);
    },
    onSuccess: () => {
      toast({ title: "Class created successfully" });
      setClassForm({ name: "", section: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to create class" });
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (data: typeof subjectForm) => {
      return apiRequest("POST", "/api/admin/subjects", data);
    },
    onSuccess: () => {
      toast({ title: "Subject created successfully" });
      setSubjectForm({ name: "", description: "", classId: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to create subject" });
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (data: typeof teacherForm) => {
      return apiRequest("POST", "/api/admin/teachers", data);
    },
    onSuccess: () => {
      toast({ title: "Teacher created successfully" });
      setTeacherForm({ username: "", email: "", password: "", fullName: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to create teacher" });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: typeof studentForm) => {
      return apiRequest("POST", "/api/admin/students", data);
    },
    onSuccess: () => {
      toast({ title: "Student created successfully" });
      setStudentForm({ username: "", email: "", password: "", fullName: "", studentId: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to create student" });
    },
  });

  const assignTeacherMutation = useMutation({
    mutationFn: async (data: typeof assignTeacherForm) => {
      return apiRequest("POST", "/api/admin/assign-teacher", data);
    },
    onSuccess: () => {
      toast({ title: "Teacher assigned successfully" });
      toast({ title: "Teacher assigned successfully" });
      setAssignTeacherForm({ teacherId: "", classIds: [], subjectId: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teacher-assignments"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to assign teacher",
        description: error.message
      });
    },
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async (data: typeof enrollStudentForm) => {
      return apiRequest("POST", "/api/admin/enroll-student", data);
    },
    onSuccess: () => {
      toast({ title: "Student enrolled successfully" });
      setEnrollStudentForm({ studentId: "", classId: "", rollNumber: "" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to enroll student",
        description: error.message
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/classes/${id}`),
    onSuccess: () => {
      toast({ title: "Class deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete class",
        description: error.message
      });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/subjects/${id}`),
    onSuccess: () => {
      toast({ title: "Subject deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete subject",
        description: error.message
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      toast({ title: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/list-admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete user",
        description: error.message
      });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/teacher-assignments/${id}`),
    onSuccess: () => {
      toast({ title: "Assignment deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teacher-assignments"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to delete assignment" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Teacher & Student> & { password?: string } }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}`, data);
    },
    onSuccess: (_, variables) => {
      toast({ title: "User updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      // Update the local selected teacher if it's the one we just edited
      if (selectedTeacher && selectedTeacher.id === variables.id) {
        setSelectedTeacher({ ...selectedTeacher, ...variables.data } as Teacher);
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error.message
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your school system</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSubjects || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAdmins || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="classes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="assign">Assign Teacher</TabsTrigger>
            <TabsTrigger value="enroll">Enroll Student</TabsTrigger>
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Class</CardTitle>
                  <CardDescription>Add a new class to the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      createClassMutation.mutate(classForm);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="className">Class Name *</Label>
                      <Input
                        id="className"
                        placeholder="e.g., Class 10"
                        value={classForm.name}
                        onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        placeholder="e.g., A, B, Science"
                        value={classForm.section}
                        onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                      />
                    </div>
                    <Button type="submit" disabled={createClassMutation.isPending}>
                      {createClassMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Class
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Classes ({classes.length})</CardTitle>
                  <CardDescription>Manage existing classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {classes.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-sm text-muted-foreground">Section: {cls.section || "N/A"}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Are you sure? This will delete all related data.")) {
                              deleteClassMutation.mutate(cls.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Subject</CardTitle>
                  <CardDescription>Add a new subject to the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      createSubjectMutation.mutate(subjectForm);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="subjectClass">Class (Optional)</Label>
                      <Select
                        value={subjectForm.classId}
                        onValueChange={(value) => setSubjectForm({ ...subjectForm, classId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} - {cls.section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subjectName">Subject Name *</Label>
                      <Input
                        id="subjectName"
                        placeholder="e.g., Mathematics"
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Brief description"
                        value={subjectForm.description}
                        onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                      />
                    </div>
                    <Button type="submit" disabled={createSubjectMutation.isPending}>
                      {createSubjectMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Subject
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Subjects ({subjects.length})</CardTitle>
                  <CardDescription>Manage existing subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {subjects.map((subj) => (
                      <div key={subj.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <p className="font-medium">{subj.name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Are you sure?")) {
                              deleteSubjectMutation.mutate(subj.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Teacher</CardTitle>
                  <CardDescription>Add a new teacher to the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      createTeacherMutation.mutate(teacherForm);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="teacherName">Full Name *</Label>
                      <Input
                        id="teacherName"
                        placeholder="John Doe"
                        value={teacherForm.fullName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacherUsername">Username *</Label>
                      <Input
                        id="teacherUsername"
                        placeholder="johndoe"
                        value={teacherForm.username}
                        onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacherEmail">Email *</Label>
                      <Input
                        id="teacherEmail"
                        type="email"
                        placeholder="john@school.com"
                        value={teacherForm.email}
                        onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacherPassword">Password *</Label>
                      <div className="relative">
                        <Input
                          id="teacherPassword"
                          type={showTeacherPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={teacherForm.password}
                          onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                        >
                          {showTeacherPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" disabled={createTeacherMutation.isPending}>
                      {createTeacherMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Teacher
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Teachers ({teachers.length})</CardTitle>
                  <CardDescription>Manage existing teachers</CardDescription>
                  <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search teachers..."
                      className="pl-8"
                      value={searchTeacher}
                      onChange={(e) => setSearchTeacher(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {teachers
                      .filter(t => t.fullName.toLowerCase().includes(searchTeacher.toLowerCase()) ||
                        t.username?.toLowerCase().includes(searchTeacher.toLowerCase()))
                      .map((teacher) => (
                        <div key={teacher.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div
                            className="cursor-pointer hover:bg-muted/50 p-2 rounded flex-1 mr-2"
                            onClick={() => setSelectedTeacher(teacher)}
                          >
                            <p className="font-medium">{teacher.fullName}</p>
                            <p className="text-sm text-muted-foreground">{teacher.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Are you sure?")) {
                                deleteUserMutation.mutate(teacher.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    {teachers.length > 0 && teachers.filter(t => t.fullName.toLowerCase().includes(searchTeacher.toLowerCase()) ||
                      t.username?.toLowerCase().includes(searchTeacher.toLowerCase())).length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No teachers found.</p>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Student</CardTitle>
                  <CardDescription>Add a new student to the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      createStudentMutation.mutate(studentForm);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="studentName">Full Name *</Label>
                      <Input
                        id="studentName"
                        placeholder="Jane Doe"
                        value={studentForm.fullName}
                        onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentId">Student ID *</Label>
                      <Input
                        id="studentId"
                        placeholder="STU001"
                        value={studentForm.studentId}
                        onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentUsername">Username *</Label>
                      <Input
                        id="studentUsername"
                        placeholder="janedoe"
                        value={studentForm.username}
                        onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentEmail">Email *</Label>
                      <Input
                        id="studentEmail"
                        type="email"
                        placeholder="jane@school.com"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentPassword">Password *</Label>
                      <div className="relative">
                        <Input
                          id="studentPassword"
                          type={showStudentPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={studentForm.password}
                          onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                        >
                          {showStudentPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" disabled={createStudentMutation.isPending}>
                      {createStudentMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Student
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Students ({students.length})</CardTitle>
                  <CardDescription>Manage existing students</CardDescription>
                  <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      className="pl-8"
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {(() => {
                      const filtered = students.filter(s =>
                        s.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
                        s.studentId?.toLowerCase().includes(searchStudent.toLowerCase()) ||
                        s.username?.toLowerCase().includes(searchStudent.toLowerCase())
                      );

                      if (filtered.length === 0) {
                        return <p className="text-center text-muted-foreground py-4">No students found.</p>;
                      }

                      // Group by Class
                      const grouped: Record<string, Student[]> = {};
                      filtered.forEach(s => {
                        const key = s.className ? `${s.className} ${s.section ? `(${s.section})` : ""}` : "Not Enrolled";
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(s);
                      });

                      // Sort keys (Not Enrolled last)
                      const keys = Object.keys(grouped).sort((a, b) => {
                        if (a === "Not Enrolled") return 1;
                        if (b === "Not Enrolled") return -1;
                        return a.localeCompare(b);
                      });

                      return keys.map(className => {
                        const isExpanded = expandedClasses[className];
                        const count = grouped[className].length;

                        // Sort students by Roll Number
                        const sortedStudents = grouped[className].sort((a, b) => {
                          const r1 = a.rollNumber || 999999;
                          const r2 = b.rollNumber || 999999;
                          return r1 - r2;
                        });

                        return (
                          <div key={className} className="border rounded-lg overflow-hidden">
                            <div
                              className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => setExpandedClasses(prev => ({ ...prev, [className]: !prev[className] }))}
                            >
                              <div className="flex items-center gap-2">
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-semibold text-sm">{className}</h4>
                                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                                  {count}
                                </span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-2 space-y-2 border-t bg-card animate-in slide-in-from-top-2 duration-200">
                                {sortedStudents.map(student => (
                                  <div key={student.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg pl-8">
                                    <div
                                      className="cursor-pointer flex-1 mr-2"
                                      onClick={() => setSelectedStudent(student)}
                                    >
                                      <p className="font-medium text-sm">{student.rollNumber ? `${student.rollNumber}. ` : ""}{student.fullName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {student.studentId || student.username} • {student.email}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Are you sure?")) {
                                          deleteUserMutation.mutate(student.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>All Admins ({adminUsers.length})</CardTitle>
                <CardDescription>View system administrators and organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {adminUsers.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{admin.fullName}</p>
                        <p className="text-sm text-muted-foreground">{admin.email || admin.username}</p>
                        <p className="text-xs text-muted-foreground capitalize">Role: {admin.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this admin?")) {
                              // Type assertion or converting ID to string if mostly number
                              deleteUserMutation.mutate(String(admin.id));
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assign Teacher Tab */}
          <TabsContent value="assign">
            <Card>
              <CardHeader>
                <CardTitle>Assign Teacher to Class</CardTitle>
                <CardDescription>Link teachers with classes and subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    assignTeacherMutation.mutate(assignTeacherForm);
                  }}
                  className="space-y-4 max-w-md"
                >
                  <div>
                    <Label htmlFor="assignTeacher">Select Teacher *</Label>
                    <Select
                      value={assignTeacherForm.teacherId}
                      onValueChange={(value) =>
                        setAssignTeacherForm({ ...assignTeacherForm, teacherId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">Select Classes *</Label>
                    <Popover open={openClassSelect} onOpenChange={setOpenClassSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openClassSelect}
                          className="w-full justify-between"
                        >
                          {assignTeacherForm.classIds.length > 0
                            ? `${assignTeacherForm.classIds.length} classes selected`
                            : "Select classes..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search class..." />
                          <CommandList>
                            <CommandEmpty>No class found.</CommandEmpty>
                            <CommandGroup>
                              {classes.map((cls) => (
                                <CommandItem
                                  key={cls.id}
                                  value={cls.id}
                                  onSelect={() => {
                                    setAssignTeacherForm((prev) => {
                                      const currentIds = prev.classIds;
                                      const newIds = currentIds.includes(cls.id)
                                        ? currentIds.filter((id) => id !== cls.id)
                                        : [...currentIds, cls.id];
                                      return { ...prev, classIds: newIds };
                                    });
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      assignTeacherForm.classIds.includes(cls.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {cls.name} {cls.section ? `- ${cls.section}` : ""}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="assignSubject">Select Subject (Optional)</Label>
                    <Select
                      value={assignTeacherForm.subjectId}
                      onValueChange={(value) =>
                        setAssignTeacherForm({ ...assignTeacherForm, subjectId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subj) => (
                          <SelectItem key={subj.id} value={subj.id}>
                            {subj.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" disabled={assignTeacherMutation.isPending}>
                    {assignTeacherMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      "Assign Teacher"
                    )}
                  </Button>
                </form>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Current Assignments</h3>
                  <div className="space-y-2">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.teacherName}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.className} - {assignment.section}
                            {assignment.subjectName && ` • ${assignment.subjectName}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Are you sure?")) {
                              deleteAssignmentMutation.mutate(assignment.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {assignments.length === 0 && (
                      <p className="text-sm text-muted-foreground">No teachers assigned yet.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enroll Student Tab */}
          <TabsContent value="enroll">
            <Card>
              <CardHeader>
                <CardTitle>Enroll Student in Class</CardTitle>
                <CardDescription>Add students to classes</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    enrollStudentMutation.mutate(enrollStudentForm);
                  }}
                  className="space-y-4 max-w-md"
                >
                  <div>
                    <Label htmlFor="enrollStudent">Select Student *</Label>
                    <Select
                      value={enrollStudentForm.studentId}
                      onValueChange={(value) =>
                        setEnrollStudentForm({ ...enrollStudentForm, studentId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.fullName} ({student.studentId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="enrollClass">Select Class *</Label>
                    <Select
                      value={enrollStudentForm.classId}
                      onValueChange={(value) =>
                        setEnrollStudentForm({ ...enrollStudentForm, classId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - {cls.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      type="number"
                      placeholder="e.g., 15"
                      value={enrollStudentForm.rollNumber}
                      onChange={(e) => setEnrollStudentForm({ ...enrollStudentForm, rollNumber: e.target.value })}
                    />
                  </div>

                  <Button type="submit" disabled={enrollStudentMutation.isPending}>
                    {enrollStudentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      "Enroll Student"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>Information about {selectedStudent?.fullName}</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editStudentName}
                      onChange={(e) => setEditStudentName(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (selectedStudent) {
                          updateUserMutation.mutate({
                            id: selectedStudent.id,
                            data: { fullName: editStudentName }
                          });
                        }
                      }}
                      disabled={updateUserMutation.isPending || !selectedStudent || editStudentName === selectedStudent.fullName}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Student ID</Label>
                    <div className="flex gap-2">
                      <Input
                        value={editStudentId}
                        onChange={(e) => setEditStudentId(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedStudent) {
                            updateUserMutation.mutate({
                              id: selectedStudent.id,
                              data: { studentId: editStudentId }
                            });
                          }
                        }}
                        disabled={updateUserMutation.isPending || !selectedStudent || editStudentId === selectedStudent.studentId}
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={editStudentRoll}
                        onChange={(e) => setEditStudentRoll(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedStudent) {
                            updateUserMutation.mutate({
                              id: selectedStudent.id,
                              data: { rollNumber: parseInt(editStudentRoll) }
                            });
                          }
                        }}
                        disabled={updateUserMutation.isPending || !selectedStudent || editStudentRoll === String(selectedStudent.rollNumber)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Username</Label>
                    <p className="font-medium">{selectedStudent.username}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Class</Label>
                    <p className="font-medium">
                      {selectedStudent.className ? `${selectedStudent.className} - ${selectedStudent.section}` : "Not Enrolled"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Reset Password</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="New Password (min 6 chars)"
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      if (selectedStudent && newStudentPassword.length >= 6) {
                        updateUserMutation.mutate({
                          id: selectedStudent.id,
                          data: { password: newStudentPassword }
                        }, {
                          onSuccess: () => {
                            setNewStudentPassword("");
                            toast({ title: "Success", description: "Password updated successfully" });
                          }
                        });
                      }
                    }}
                    disabled={updateUserMutation.isPending || !selectedStudent || newStudentPassword.length < 6}
                  >
                    {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Teacher Details Dialog */}
      <Dialog open={!!selectedTeacher} onOpenChange={(open) => !open && setSelectedTeacher(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
            <DialogDescription>View and edit teacher information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="flex gap-2">
                <Input
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (selectedTeacher && editTeacherName !== selectedTeacher.fullName) {
                      updateUserMutation.mutate({
                        id: selectedTeacher.id,
                        data: { fullName: editTeacherName }
                      });
                    }
                  }}
                  disabled={updateUserMutation.isPending || !selectedTeacher || editTeacherName === selectedTeacher.fullName}
                >
                  {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reset Password</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="New Password (min 6 chars)"
                  value={newTeacherPassword}
                  onChange={(e) => setNewTeacherPassword(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (selectedTeacher && newTeacherPassword.length >= 6) {
                      updateUserMutation.mutate({
                        id: selectedTeacher.id,
                        data: { password: newTeacherPassword }
                      }, {
                        onSuccess: () => {
                          setNewTeacherPassword("");
                          toast({ title: "Success", description: "Password updated successfully" });
                        }
                      });
                    }
                  }}
                  disabled={updateUserMutation.isPending || !selectedTeacher || newTeacherPassword.length < 6}
                >
                  {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Allocated Classes</h4>
              {(() => {
                if (!selectedTeacher) return null;
                console.log("Selected Teacher:", selectedTeacher);
                console.log("All Assignments:", assignments);

                const teacherAssignments = assignments.filter(a =>
                  a.teacherId === selectedTeacher.id ||
                  // Fallback: match by name if ID is missing or mismatch
                  a.teacherName === selectedTeacher.fullName
                );

                if (teacherAssignments.length > 0) {
                  return (
                    <div className="border rounded-md p-2 space-y-2 max-h-40 overflow-y-auto">
                      {teacherAssignments.map((assignment, idx) => (
                        <div key={idx} className="text-sm border-b last:border-0 pb-1 mb-1 last:pb-0 last:mb-0">
                          <span className="font-semibold">{assignment.className} {assignment.section && `- ${assignment.section}`}</span>
                          {assignment.subjectName && <span className="text-muted-foreground ml-2">({assignment.subjectName})</span>}
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return <p className="text-sm text-muted-foreground">No classes allocated yet.</p>;
                }
              })()}
            </div>

            <div className="text-xs text-muted-foreground">
              Email: {selectedTeacher?.email}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

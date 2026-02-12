import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";

const StudentRegistration: React.FC = () => {
  const [enrollNo, setEnrollNo] = useState("");
  const [classId, setClassId] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRegister = async () => {
    if (!enrollNo || !classId || !grade) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Simulate verification and registration
    try {
      // Replace with actual API call for verification and registration
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: enrollNo,
          enrollNo,
          classId,
          grade,
          role: "student"
        })
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: "Registration successful!" });
        // Redirect or continue registration flow
      } else {
        toast({ title: "Error", description: result.message || "Registration failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <h2 className="text-xl font-bold">Student Registration</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Enrollment Number"
            value={enrollNo}
            onChange={(e) => setEnrollNo(e.target.value)}
          />
          <Input
            placeholder="Class (e.g. 9th Standard)"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
          <Input
            placeholder="Grade (e.g. A, B, C)"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
          <Button onClick={handleRegister} disabled={loading} className="w-full">
            {loading ? "Registering..." : "Register & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentRegistration;

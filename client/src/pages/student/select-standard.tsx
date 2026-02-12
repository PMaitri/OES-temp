import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useToast } from "../../hooks/use-toast";

const SelectStandard: React.FC = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch available classes from API
    fetch("/api/classes", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .catch(() => toast({ title: "Error", description: "Failed to load classes", variant: "destructive" }));
  }, [toast]);

  const handleSelect = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await fetch("/api/student/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ classId: selectedClass }),
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: "Class selected successfully!" });
      } else {
        toast({ title: "Error", description: result.message || "Failed to enroll", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <h2 className="text-xl font-bold">Select Your Standard</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <select
            className="w-full border rounded p-2"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Select Standard --</option>
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <Button onClick={handleSelect} disabled={loading || !selectedClass} className="w-full">
            {loading ? "Enrolling..." : "Select"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectStandard;

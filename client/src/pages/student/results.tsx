import { AppNavbar } from "@/components/app-navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar, FileText, TrendingUp, Eye } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface Result {
  id: string;
  examId: string;
  exam: {
    title: string;
    totalMarks: number;
  };
  submittedAt: string;
  totalScore: number;
  percentage: number;
  isPassed: boolean;
}

export default function StudentResults() {
  const { data: results, isLoading } = useQuery<Result[]>({
    queryKey: ["/api/student/results"],
  });

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-chart-2";
    if (percentage >= 75) return "text-primary";
    if (percentage >= 60) return "text-chart-3";
    if (percentage >= 40) return "text-chart-4";
    return "text-destructive";
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "F";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Exam Results</h1>
          <p className="text-muted-foreground">View your completed exam results and scores</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results && results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2" data-testid={`result-title-${result.id}`}>
                            {result.exam.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(result.submittedAt), "MMM dd, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              Total Marks: {result.exam.totalMarks}
                            </span>
                          </div>
                        </div>
                        <Badge variant={result.isPassed ? "default" : "destructive"}>
                          {result.isPassed ? "Passed" : "Failed"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Score</p>
                          <p className="text-2xl font-mono font-bold">
                            {result.totalScore} / {result.exam.totalMarks}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Percentage</p>
                          <p className={`text-2xl font-mono font-bold ${getGradeColor(result.percentage)}`}>
                            {result.percentage}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Grade</p>
                          <p className={`text-2xl font-mono font-bold ${getGradeColor(result.percentage)}`}>
                            {getGrade(result.percentage)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link href={`/student/exam-result/${result.examId}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-details-${result.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                You haven't completed any exams yet. Start taking exams to see your results here.
              </p>
              <Link href="/student/dashboard">
                <Button data-testid="button-go-dashboard">
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

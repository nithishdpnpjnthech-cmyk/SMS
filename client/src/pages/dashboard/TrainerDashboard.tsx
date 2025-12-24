import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function TrainerDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayClasses: 0,
    batches: []
  });
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTrainerData();
  }, []);

  const loadTrainerData = async () => {
    try {
      if (!user?.id) {
        setStats({ totalStudents: 0, todayClasses: 0, batches: [] });
        setStudents([]);
        return;
      }

      const [dashboardStats, trainerStudents] = await Promise.all([
        api.getTrainerDashboard(user.id),
        api.getTrainerStudents(user.id)
      ]);
      
      setStats(dashboardStats || { totalStudents: 0, todayClasses: 0, batches: [] });
      setStudents(trainerStudents || []);
    } catch (error) {
      console.error("Failed to load trainer data:", error);
      setStats({ totalStudents: 0, todayClasses: 0, batches: [] });
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getScheduleForToday = () => {
    // Only show real batch assignments, no mock schedule
    return stats.batches.map((batch) => ({
      program: batch.program,
      batch: batch.batch_name,
      studentCount: students.filter(s => s.batch === batch.batch_name && s.program === batch.program).length
    }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading trainer portal...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const schedule = getScheduleForToday();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Trainer Portal</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || 'Trainer'}.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg opacity-90">Assigned Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.batches.length}</div>
              <p className="text-sm opacity-80 mt-1">Active assignments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">My Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalStudents}</div>
              <p className="text-sm text-muted-foreground mt-1">Across {stats.batches.length} batches</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{[...new Set(stats.batches.map(b => b.program))].length}</div>
              <p className="text-sm text-muted-foreground mt-1">Teaching programs</p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Batches */}
        {stats.batches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>My Assigned Batches</CardTitle>
              <CardDescription>Batches you are currently teaching</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.batches.map((batch, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{batch.program}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{batch.batch_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {students.filter(s => s.batch === batch.batch_name && s.program === batch.program).length} students
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assigned Batches Summary */}
        {stats.batches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Batch Summary</CardTitle>
              <CardDescription>Overview of your assigned batches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.program}</h3>
                        <p className="text-sm text-muted-foreground">{item.batch}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" /> {item.studentCount} Students
                      </span>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Students */}
        {students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>My Students</CardTitle>
              <CardDescription>Students in your assigned batches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {students.slice(0, 10).map((student, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {student.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.program} - {student.batch}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{student.status}</Badge>
                  </div>
                ))}
                {students.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    And {students.length - 10} more students...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

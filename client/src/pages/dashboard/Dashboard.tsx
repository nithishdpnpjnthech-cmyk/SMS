import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  CreditCard,
  AlertCircle,
  Plus,
  Download,
  Settings,
  Calendar,
  FileText,
  UserPlus,
  Coins
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatAmount } from "@/lib/currency";

interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  feesCollectedToday: number;
  pendingDues: number;
  totalRevenue: number;
  trainersPresentToday: number;
  trainerNames: string[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    feesCollectedToday: 0,
    pendingDues: 0,
    totalRevenue: 0,
    trainersPresentToday: 0,
    trainerNames: []
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadDashboardStats();
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      const [statsData, studentsData] = await Promise.all([
        api.getDashboardStats(user?.branchId),
        api.getStudents({ limit: '5' })
      ]);
      setStats(statsData);
      setRecentStudents(studentsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Overview of today's academy operations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none shadow-sm" onClick={() => setLocation("/branches")}>
              <Settings className="mr-2 h-4 w-4" />
              Branches
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none shadow-sm" onClick={() => setLocation("/reports")}>
              <Download className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button size="sm" className="w-full sm:w-auto shadow-sm" onClick={() => setLocation("/students?add=true")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Card className="border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Active students</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.presentToday} / {stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Present today</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.feesCollectedToday)}</div>
              <p className="text-xs text-muted-foreground">Today's revenue</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatAmount(stats.pendingDues)}</div>
              <p className="text-xs text-muted-foreground">Outstanding fees</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trainers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trainersPresentToday}</div>
              <p className="text-xs text-muted-foreground">
                {stats.trainerNames.length > 0
                  ? stats.trainerNames.join(", ")
                  : "None active now"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Recent Students Area */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Students</CardTitle>
              <p className="text-xs text-muted-foreground">Latest student registrations</p>
            </CardHeader>
            <CardContent>
              {recentStudents.length > 0 ? (
                <div className="space-y-4">
                  {recentStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.program || "No Program"} • {student.batch || "No Batch"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">{student.status}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'New'}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-xs" onClick={() => setLocation("/students")}>
                    View All Students
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-4">No students found. Add your first student!</p>
                  <Button variant="outline" size="sm" onClick={() => setLocation("/students?add=true")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Area */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all border shadow-sm"
                  onClick={() => setLocation("/students?add=true")}
                >
                  <UserPlus className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">Add Student</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all border shadow-sm"
                  onClick={() => setLocation("/fees")}
                >
                  <Coins className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">Collect Fee</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all border shadow-sm"
                  onClick={() => setLocation("/attendance")}
                >
                  <Calendar className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">Attendance</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all border shadow-sm"
                  onClick={() => setLocation("/reports")}
                >
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">Reports</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  IndianRupee, 
  TrendingUp,
  Clock,
  MapPin,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { formatAmount } from "@/lib/currency";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    feesCollectedToday: 0,
    pendingDues: 0
  });
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // ✅ Check if non-admin user has branch assigned
      if (user?.role !== 'admin' && !user?.branchId) {
        console.warn('Non-admin user has no branch assigned:', user);
        setStats({
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          feesCollectedToday: 0,
          pendingDues: 0
        });
        setStudents([]);
        setIsLoading(false);
        return;
      }
      
      // ✅ For admin: no branchId, for others: use their branchId
      const branchId = user?.role === 'admin' ? undefined : user?.branchId;
      
      const [dashboardStats, studentsData] = await Promise.all([
        api.getDashboardStats(branchId),
        api.getStudents(branchId)
      ]);
      
      // ✅ Defensive: Ensure data is valid before setting
      setStats(dashboardStats || {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        feesCollectedToday: 0,
        pendingDues: 0
      });
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      console.log("Dashboard loaded:", { stats: dashboardStats, students: studentsData });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      // ✅ Set empty data on error instead of crashing
      setStats({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        feesCollectedToday: 0,
        pendingDues: 0
      });
      setStudents([]);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-student':
        if (hasPermission('students.write')) {
          setLocation('/students/add');
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have permission to add students",
            variant: "destructive"
          });
        }
        break;
      case 'collect-fee':
        if (hasPermission('fees.write')) {
          setLocation('/fees/collect');
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have permission to collect fees",
            variant: "destructive"
          });
        }
        break;
      case 'attendance':
        setLocation('/attendance');
        break;
      case 'reports':
        if (hasPermission('reports.read')) {
          setLocation('/reports');
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view reports",
            variant: "destructive"
          });
        }
        break;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ✅ Show branch assignment error for non-admin users
  if (user?.role !== 'admin' && !user?.branchId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Branch Not Assigned</h2>
            <p className="text-muted-foreground mb-4">
              Your account is not assigned to any branch. Please contact the administrator to assign you to a branch.
            </p>
            <Badge variant="outline" className="text-sm">
              Role: {user?.role} | User: {user?.username}
            </Badge>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Dashboard</h1>
            <p className="text-muted-foreground">Overview of today's academy operations.</p>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <Button variant="outline" onClick={() => setLocation('/branches')}>Manage Branches</Button>
            )}
            {hasPermission('reports.read') && (
              <Button variant="outline" onClick={() => handleQuickAction('reports')}>Download Report</Button>
            )}
            {hasPermission('students.write') && (
              <Button onClick={() => handleQuickAction('add-student')}>Add Student</Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-elevate transition-all border-l-4 border-l-primary cursor-pointer" onClick={() => setLocation('/students')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Active students
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-green-500 cursor-pointer" onClick={() => setLocation('/attendance')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.presentToday} / {stats.presentToday + stats.absentToday}</div>
              <p className="text-xs text-muted-foreground">
                Present today
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-blue-500 cursor-pointer" onClick={() => hasPermission('fees.read') && setLocation('/fees')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.feesCollectedToday)}</div>
              <p className="text-xs text-muted-foreground">
                Today's revenue
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-orange-500 cursor-pointer" onClick={() => hasPermission('fees.read') && setLocation('/fees')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatAmount(stats.pendingDues)}</div>
              <p className="text-xs text-muted-foreground">
                Outstanding fees
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Students */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Students</CardTitle>
              <CardDescription>Latest student registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.slice(0, 5).map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {student.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{student.program} - {student.batch}</span>
                          {user?.role === 'admin' && student.branch_name && (
                            <Badge variant="secondary" className="text-xs">{student.branch_name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{student.status}</Badge>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No students found. Add your first student!</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {hasPermission('students.write') && (
                <Button 
                  variant="outline" 
                  className="w-full h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                  onClick={() => handleQuickAction('add-student')}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Add Student</span>
                </Button>
              )}
              {hasPermission('fees.write') && (
                <Button 
                  variant="outline" 
                  className="w-full h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                  onClick={() => handleQuickAction('collect-fee')}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Collect Fee</span>
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                onClick={() => handleQuickAction('attendance')}
              >
                <CalendarCheck className="h-5 w-5" />
                <span className="text-xs">Attendance</span>
              </Button>
              {hasPermission('reports.read') && (
                <Button 
                  variant="outline" 
                  className="w-full h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                  onClick={() => handleQuickAction('reports')}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Reports</span>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

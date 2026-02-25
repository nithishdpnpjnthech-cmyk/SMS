import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, IndianRupee, AlertCircle, MapPin, Download } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatAmount } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    feesCollectedToday: 0,
    pendingDues: 0,
    totalRevenue: 0
  });
  const [branch, setBranch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadManagerData();
  }, []);

  const loadManagerData = async () => {
    try {
      if (!user?.branchId) {
        console.warn('Manager not assigned to any branch');
        // Set empty stats instead of throwing error
        setStats({
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          feesCollectedToday: 0,
          pendingDues: 0,
          totalRevenue: 0
        });
        setBranch({ name: 'No Branch Assigned', address: '', phone: '' });
        return;
      }

      const [dashboardStats, branches] = await Promise.all([
        api.getDashboardStats(user.branchId),
        api.getBranches()
      ]);

      const userBranch = branches.find(b => b.id === user.branchId);

      setStats(dashboardStats || {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        feesCollectedToday: 0,
        pendingDues: 0,
        totalRevenue: 0
      });
      setBranch(userBranch || { name: 'Branch Not Found', address: '', phone: '' });

      console.log("Manager dashboard loaded:", { stats: dashboardStats, branch: userBranch });
    } catch (error) {
      console.error("Failed to load manager data:", error);
      // Set empty stats on error instead of showing error toast
      setStats({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        feesCollectedToday: 0,
        pendingDues: 0,
        totalRevenue: 0
      });
      setBranch({ name: 'Error Loading Branch', address: '', phone: '' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading branch data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-xl shadow-sm border border-muted/50">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Branch Manager</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
              <p className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-primary/60" />
                {branch?.name || 'Branch Dashboard'}
              </p>
              {branch?.address && (
                <p className="text-xs text-muted-foreground sm:border-l sm:pl-4 opacity-80">{branch.address}</p>
              )}
            </div>
          </div>
          <Button variant="outline" className="w-full md:w-auto shadow-sm">
            <Download className="mr-2 h-4 w-4" />
            Download Monthly Report
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold mt-2">{stats.totalStudents}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Active enrollments</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Monthly Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-green-500/80" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold mt-2 text-green-600">{formatAmount(stats.totalRevenue)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Total collected</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Today's Collection</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500/80" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold mt-2 text-blue-600">{formatAmount(stats.feesCollectedToday)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Recorded today</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending Dues</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500/80" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold mt-2 text-orange-600">{formatAmount(stats.pendingDues)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Branch Performance */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm border-muted/50 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-muted/50">
              <CardTitle className="text-lg font-heading">Attendance Overview</CardTitle>
              <CardDescription>Today's student attendance across all batches</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-muted-foreground">Present Today</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 font-bold">
                      {stats.presentToday}
                    </Badge>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden border border-muted/50">
                    <div
                      className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all duration-500"
                      style={{ width: `${stats.presentToday + stats.absentToday > 0 ? (stats.presentToday / (stats.presentToday + stats.absentToday)) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-muted-foreground">Absent Today</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 font-bold">
                      {stats.absentToday}
                    </Badge>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden border border-muted/50">
                    <div
                      className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-500"
                      style={{ width: `${stats.presentToday + stats.absentToday > 0 ? (stats.absentToday / (stats.presentToday + stats.absentToday)) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="pt-6 border-t border-muted/50">
                  <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                    <span className="font-bold text-blue-900/70">Overall Attendance Rate</span>
                    <span className="text-lg font-black text-blue-700">
                      {stats.presentToday + stats.absentToday > 0
                        ? Math.round((stats.presentToday / (stats.presentToday + stats.absentToday)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted/50 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-muted/50">
              <CardTitle className="text-lg font-heading">Branch Information</CardTitle>
              <CardDescription>Detailed branch profile and metrics</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Branch Name</p>
                    <p className="text-lg font-black text-foreground font-heading">{branch?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Contact Phone</p>
                    <p className="text-base font-bold text-foreground">{branch?.phone || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Operational Address</p>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">{branch?.address}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-muted/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/20 rounded-2xl border border-muted/50 text-center shadow-inner">
                      <p className="text-2xl sm:text-3xl font-black text-primary font-heading">{stats.totalStudents}</p>
                      <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase mt-1">Total Students</p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-2xl border border-muted/50 text-center shadow-inner">
                      <p className="text-xl sm:text-2xl font-black text-green-600 font-heading">{formatAmount(stats.totalRevenue).split('.')[0]}</p>
                      <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase mt-1">Lifetime Revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

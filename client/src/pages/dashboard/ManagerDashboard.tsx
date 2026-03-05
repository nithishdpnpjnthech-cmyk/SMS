import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, IndianRupee, AlertCircle, MapPin, Download, Calendar } from "lucide-react";
import { Link } from "wouter";
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

      const userBranch = branches.find((b: any) => b.id === user.branchId);

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
          <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Today's Collection</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary/80" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold mt-2 text-primary">{formatAmount(stats.feesCollectedToday)}</div>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/fees/collect" className="contents">
            <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md hover:bg-muted/30 group">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <IndianRupee className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base">Collect Fee</h3>
                  <p className="text-[10px] text-muted-foreground">UPI & Cash</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/students" className="contents">
            <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md hover:bg-muted/30 group">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <Users className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base">All Students</h3>
                  <p className="text-[10px] text-muted-foreground">Manage enrollment</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/attendance" className="contents">
            <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md hover:bg-muted/30 group">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <Calendar className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base">Attendance</h3>
                  <p className="text-[10px] text-muted-foreground">Daily logs</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports" className="contents">
            <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md hover:bg-muted/30 group">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-yellow-100 text-yellow-600 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base">Analytics</h3>
                  <p className="text-[10px] text-muted-foreground">View insights</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

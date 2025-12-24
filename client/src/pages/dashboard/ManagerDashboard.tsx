import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, IndianRupee, AlertCircle, MapPin } from "lucide-react";
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
      if (!user?.branch_id) {
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
        api.getDashboardStats(user.branch_id),
        api.getBranches()
      ]);
      
      const userBranch = branches.find(b => b.id === user.branch_id);
      
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Branch Manager</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <strong>{branch?.name || 'Branch Dashboard'}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{branch?.address}</p>
          </div>
          <Button variant="outline">Download Monthly Report</Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Active students in branch</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Total collected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.feesCollectedToday)}</div>
              <p className="text-xs text-muted-foreground">Fees collected today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatAmount(stats.pendingDues)}</div>
              <p className="text-xs text-muted-foreground">Outstanding fees</p>
            </CardContent>
          </Card>
        </div>

        {/* Branch Performance */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Today's student attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Present Today</span>
                    <span className="text-green-600 font-bold">{stats.presentToday}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${stats.presentToday + stats.absentToday > 0 ? (stats.presentToday / (stats.presentToday + stats.absentToday)) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Absent Today</span>
                    <span className="text-red-600 font-bold">{stats.absentToday}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500" 
                      style={{ width: `${stats.presentToday + stats.absentToday > 0 ? (stats.absentToday / (stats.presentToday + stats.absentToday)) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Attendance Rate</span>
                    <span className="text-blue-600 font-bold">
                      {stats.presentToday + stats.absentToday > 0 
                        ? Math.round((stats.presentToday / (stats.presentToday + stats.absentToday)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branch Information</CardTitle>
              <CardDescription>Branch details and contact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Branch Name</p>
                  <p className="text-lg font-semibold">{branch?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">{branch?.address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{branch?.phone}</p>
                </div>
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.totalStudents}</p>
                      <p className="text-xs text-muted-foreground">Total Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{formatAmount(stats.totalRevenue)}</p>
                      <p className="text-xs text-muted-foreground">Total Revenue</p>
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

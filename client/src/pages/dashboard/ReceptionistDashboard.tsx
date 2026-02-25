import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, CreditCard, CalendarCheck, Search, MapPin, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatAmount } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingDues: 0,
    feesCollectedToday: 0,
    presentToday: 0
  });
  const [branch, setBranch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadReceptionistData();
  }, []);

  const loadReceptionistData = async () => {
    try {
      if (!user?.branchId) {
        setStats({ totalStudents: 0, pendingDues: 0, feesCollectedToday: 0, presentToday: 0 });
        setBranch({ name: 'No Branch Assigned', address: '' });
        return;
      }

      const [dashboardStats, branches] = await Promise.all([
        api.getDashboardStats(user.branchId),
        api.getBranches()
      ]);

      const userBranch = branches.find(b => b.id === user.branchId);

      setStats(dashboardStats || {
        totalStudents: 0,
        pendingDues: 0,
        feesCollectedToday: 0,
        presentToday: 0
      });
      setBranch(userBranch || { name: 'Branch Not Found', address: '' });
    } catch (error) {
      console.error("Failed to load receptionist data:", error);
      setStats({ totalStudents: 0, pendingDues: 0, feesCollectedToday: 0, presentToday: 0 });
      setBranch({ name: 'Error Loading Branch', address: '' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a student name, ID, or phone number",
        variant: "destructive"
      });
      return;
    }
    // Implement search functionality
    toast({
      title: "Search",
      description: `Searching for: ${searchTerm}`,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading reception desk...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-xl shadow-sm border border-muted/50">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Reception Desk</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
              <p className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-primary/60" />
                {branch?.name || 'Reception Dashboard'}
              </p>
              {branch?.address && (
                <p className="text-xs text-muted-foreground sm:border-l sm:pl-4 opacity-80">{branch.address}</p>
              )}
            </div>
          </div>
          <div className="text-sm font-medium sm:text-right bg-muted/20 p-3 rounded-lg border border-muted/50 w-full sm:w-auto">
            <p className="text-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            <p className="text-primary font-bold">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Branch Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold mt-2">{stats.totalStudents}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">In this branch</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Today's Collection</CardTitle>
              <IndianRupee className="h-4 w-4 text-green-500/80" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold mt-2 text-green-600">{formatAmount(stats.feesCollectedToday)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Fees collected</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending Dues</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-500/80" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold mt-2 text-orange-600">{formatAmount(stats.pendingDues)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Outstanding</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Present Today</CardTitle>
              <CalendarCheck className="h-4 w-4 text-blue-500/80" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold mt-2 text-blue-600">{stats.presentToday}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Students</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Search */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium">Quick Student Lookup</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, or phone number..."
                    className="pl-10 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <Button size="lg" className="w-full md:w-auto" onClick={handleSearch}>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/students/add" className="contents">
            <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md hover:bg-muted/30 group">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <UserPlus className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base">New Admission</h3>
                  <p className="text-[10px] text-muted-foreground">Enroll student</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/fees/collect" className="contents">
            <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md hover:bg-muted/30 group">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <CreditCard className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base">Collect Fee</h3>
                  <p className="text-[10px] text-muted-foreground">Record payment</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/students" className="contents">
            <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md hover:bg-muted/30 group">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <Users className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base">All Students</h3>
                  <p className="text-[10px] text-muted-foreground">Manage records</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/attendance" className="contents">
            <Card className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md hover:bg-muted/30 group">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                  <CalendarCheck className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base">Attendance</h3>
                  <p className="text-[10px] text-muted-foreground">Today's logs</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

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
      if (!user?.branch_id) {
        setStats({ totalStudents: 0, pendingDues: 0, feesCollectedToday: 0, presentToday: 0 });
        setBranch({ name: 'No Branch Assigned', address: '' });
        return;
      }

      const [dashboardStats, branches] = await Promise.all([
        api.getDashboardStats(user.branch_id),
        api.getBranches()
      ]);
      
      const userBranch = branches.find(b => b.id === user.branch_id);
      
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Reception Desk</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <strong>{branch?.name || 'Reception Dashboard'}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{branch?.address}</p>
          </div>
          <div className="text-sm font-medium text-right">
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
            <p className="text-muted-foreground">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Branch Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">In this branch</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatAmount(stats.feesCollectedToday)}</div>
              <p className="text-xs text-muted-foreground">Fees collected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatAmount(stats.pendingDues)}</div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.presentToday}</div>
              <p className="text-xs text-muted-foreground">Students</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/students/add">
            <Card className="hover:border-primary/50 cursor-pointer transition-colors hover:bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <UserPlus className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">New Admission</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/fees/collect">
            <Card className="hover:border-primary/50 cursor-pointer transition-colors hover:bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Collect Fee</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/students">
            <Card className="hover:border-primary/50 cursor-pointer transition-colors hover:bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">All Students</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/attendance">
            <Card className="hover:border-primary/50 cursor-pointer transition-colors hover:bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Attendance</h3>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Download, FileText, Users, CreditCard, CalendarCheck, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { formatAmount } from "@/lib/currency";

export default function ReportsDashboard() {
  const [reportType, setReportType] = useState("students");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    pendingDues: 0,
    overdueAmount: 0,
    attendanceRate: 0,
    activePrograms: 0
  });
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  useEffect(() => {
    if (!hasPermission('reports.read')) {
      return;
    }
    loadReportStats();
    
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  const loadReportStats = async () => {
    try {
      const [dashboardStats, students, fees] = await Promise.all([
        api.getDashboardStats(),
        api.getStudents(),
        api.getFees()
      ]);
      
      const programs = [...new Set(students.map((s: any) => s.program).filter(Boolean))];
      
      // Calculate real revenue and dues
      const totalRevenue = fees
        .filter((f: any) => f.status === 'paid')
        .reduce((sum: number, fee: any) => sum + Number(fee.amount || 0), 0);
      
      const pendingDues = fees
        .filter((f: any) => f.status === 'pending')
        .reduce((sum: number, fee: any) => sum + Number(fee.amount || 0), 0);
      
      const today = new Date();
      const overdueAmount = fees
        .filter((f: any) => f.status === 'pending' && new Date(f.due_date) < today)
        .reduce((sum: number, fee: any) => sum + Number(fee.amount || 0), 0);
      
      setStats({
        totalStudents: students.length,
        totalRevenue,
        pendingDues,
        overdueAmount,
        attendanceRate: dashboardStats.presentToday + dashboardStats.absentToday > 0 
          ? Math.round((dashboardStats.presentToday / (dashboardStats.presentToday + dashboardStats.absentToday)) * 100)
          : 0,
        activePrograms: programs.length
      });
    } catch (error) {
      console.error("Failed to load report stats:", error);
    }
  };

  const generateReport = async () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Error",
        description: "Please select date range",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      let data: any[] = [];
      let filename = "";
      
      switch (reportType) {
        case "students":
          data = await api.getStudents();
          filename = `students_report_${dateFrom}_to_${dateTo}.csv`;
          break;
        case "fees":
          data = await api.getFees();
          filename = `fees_report_${dateFrom}_to_${dateTo}.csv`;
          break;
        case "attendance":
          data = await api.getAttendance();
          filename = `attendance_report_${dateFrom}_to_${dateTo}.csv`;
          break;
      }

      if (data.length === 0) {
        toast({
          title: "No Data",
          description: "No data found for the selected criteria",
          variant: "destructive"
        });
        return;
      }

      // Convert to CSV
      const csvContent = convertToCSV(data, reportType);
      downloadCSV(csvContent, filename);
      
      toast({
        title: "Success!",
        description: `${reportType} report generated successfully`
      });
    } catch (error: any) {
      console.error("Failed to generate report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const convertToCSV = (data: any[], type: string) => {
    if (data.length === 0) return "";

    let headers: string[] = [];
    let rows: string[][] = [];

    switch (type) {
      case "students":
        headers = ["ID", "Name", "Email", "Phone", "Program", "Batch", "Status", "Joining Date"];
        rows = data.map(item => [
          item.id || "",
          item.name || "",
          item.email || "",
          item.phone || "",
          item.program || "",
          item.batch || "",
          item.status || "",
          item.joining_date ? new Date(item.joining_date).toLocaleDateString() : ""
        ]);
        break;
      case "fees":
        headers = ["ID", "Student ID", "Amount", "Due Date", "Paid Date", "Status", "Payment Method"];
        rows = data.map(item => [
          item.id || "",
          item.student_id || "",
          item.amount || "",
          item.due_date ? new Date(item.due_date).toLocaleDateString() : "",
          item.paid_date ? new Date(item.paid_date).toLocaleDateString() : "",
          item.status || "",
          item.payment_method || ""
        ]);
        break;
      case "attendance":
        headers = ["ID", "Student ID", "Date", "Status", "Check In", "Check Out"];
        rows = data.map(item => [
          item.id || "",
          item.student_id || "",
          item.date ? new Date(item.date).toLocaleDateString() : "",
          item.status || "",
          item.check_in ? new Date(item.check_in).toLocaleTimeString() : "",
          item.check_out ? new Date(item.check_out).toLocaleTimeString() : ""
        ]);
        break;
    }

    const csvRows = [headers, ...rows];
    return csvRows.map(row => row.map(field => `"${field}"`).join(",")).join("\n");
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Reports</h1>
            <p className="text-muted-foreground">Generate and download academy reports</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatAmount(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatAmount(stats.pendingDues)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatAmount(stats.overdueAmount)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="students">Students Report</SelectItem>
                    <SelectItem value="fees">Fees Report</SelectItem>
                    <SelectItem value="attendance">Attendance Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={generateReport} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate & Download
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Reports will be downloaded as CSV files that can be opened in Excel or Google Sheets.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
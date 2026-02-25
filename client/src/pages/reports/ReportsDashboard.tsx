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
      const dashboardStats = await api.getDashboardStats();

      setStats({
        totalStudents: dashboardStats.totalStudents || 0,
        totalRevenue: dashboardStats.totalRevenue || 0,
        pendingDues: dashboardStats.pendingDues || 0,
        overdueAmount: dashboardStats.overdueAmount || 0, // We should ensure this is in dashboard stats or add it
        attendanceRate: dashboardStats.attendanceRate || 0,
        activePrograms: dashboardStats.activePrograms || 0
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
      const data = await api.getReportData(reportType, dateFrom, dateTo);
      const filename = `${reportType}_report_${dateFrom}_to_${dateTo}.csv`;

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
          item.batch || item.batch_name || "",
          item.status || "",
          item.joining_date || item.created_at ? new Date(item.joining_date || item.created_at).toLocaleDateString() : ""
        ]);
        break;
      case "fees":
        headers = ["ID", "Student", "Batch", "Amount", "Date", "Method", "Notes"];
        rows = data.map(item => [
          item.id || "",
          item.student_name || "",
          item.batch || "",
          item.amount || "0",
          item.payment_date ? new Date(item.payment_date).toLocaleDateString() : "",
          item.payment_method || "",
          item.notes || ""
        ]);
        break;
      case "attendance":
        headers = ["Date", "Student", "Batch", "Status", "Check In", "Check Out", "Notes"];
        rows = data.map(item => [
          item.date ? new Date(item.date).toLocaleDateString() : "",
          item.student_name || "",
          item.batch || "",
          item.status || "",
          item.check_in ? new Date(item.check_in).toLocaleTimeString() : "-",
          item.check_out ? new Date(item.check_out).toLocaleTimeString() : "-",
          item.notes || ""
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
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Reports</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Generate and download academy reports</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 px-1 sm:px-0">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{formatAmount(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending Dues</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{formatAmount(stats.pendingDues)}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Overdue Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{formatAmount(stats.overdueAmount)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Report Generator */}
        <Card className="mx-1 sm:mx-0 shadow-sm border-muted/50">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="h-5 w-5" />
              Generate Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="students">Students Report</SelectItem>
                    <SelectItem value="fees">Fees Report</SelectItem>
                    <SelectItem value="attendance">Attendance Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  className="w-full"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  className="w-full"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={generateReport} disabled={isGenerating} className="w-full sm:w-auto min-h-[44px]">
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate & Download Report
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
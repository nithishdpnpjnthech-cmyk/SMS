import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Download, FileText, Users, CreditCard, CalendarCheck, TrendingUp, IndianRupee, PieChart, BarChart3, ShieldCheck, Clock, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { formatAmount } from "@/lib/currency";
import { useAcademyBranding } from "@/hooks/use-academy-branding";
import { cn } from "@/lib/utils";

export default function ReportsDashboard() {
  const { branding } = useAcademyBranding();
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

    // Build CSV with Professional Header
    const academyNameStr = branding.academyName || "Academy Management System";
    const reportTitle = type === 'students' ? 'Student Enrollment Report'
      : type === 'fees' ? 'Financial Collections Report'
        : 'Attendance Engagement Report';

    let headers: string[] = [];
    let rows: string[][] = [];

    switch (type) {
      case "students":
        headers = ["Identity Name", "Contact Email", "Primary Phone", "Enrolled Program", "Assigned Batch", "Academic Status", "Registration Date"];
        rows = data.map((item: any) => [
          item.name || "N/A",
          item.email || "N/A",
          item.phone || "N/A",
          item.program || "N/A",
          item.batch || item.batch_name || "N/A",
          item.status ? item.status.toUpperCase() : "N/A",
          item.joining_date || item.created_at ? new Date(item.joining_date || item.created_at).toLocaleDateString() : "N/A"
        ]);
        break;
      case "fees":
        headers = ["Student Name", "Course Batch", "Transaction Amount", "Authorization Date", "Disbursement Method", "Administrative Notes"];
        rows = data.map((item: any) => [
          item.student_name || "N/A",
          item.batch || "N/A",
          `₹${(item.amount || 0).toLocaleString('en-IN')}`,
          item.payment_date ? new Date(item.payment_date).toLocaleDateString() : "N/A",
          item.payment_method ? item.payment_method.toUpperCase() : "N/A",
          item.notes || "No remarks"
        ]);
        break;
      case "attendance":
        headers = ["Session Date", "Student Identity", "Assigned Batch", "Engagement Status", "Check-In Timestamp", "Check-Out Timestamp", "Log Notes"];
        rows = data.map((item: any) => [
          item.date ? new Date(item.date).toLocaleDateString() : "N/A",
          item.student_name || "N/A",
          item.batch || "N/A",
          item.status ? item.status.toUpperCase() : "N/A",
          item.check_in ? new Date(item.check_in).toLocaleTimeString() : "PENDING",
          item.check_out ? new Date(item.check_out).toLocaleTimeString() : "PENDING",
          item.notes || "Standard log"
        ]);
        break;
    }

    const reportHeader = [
      [academyNameStr.toUpperCase()],
      [reportTitle.toUpperCase()],
      [`PERIOD: ${dateFrom} TO ${dateTo}`],
      [`GENERATED ON: ${new Date().toLocaleString()}`],
      [], // Empty row for spacing
      headers,
      ...rows
    ];

    return reportHeader.map(row => row.map(field => `"${field}"`).join(",")).join("\n");
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
      <div className="space-y-8 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="bg-white/50 p-4 sm:p-6 rounded-2xl border border-muted/50 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">Analytics & Reports</h1>
                <p className="text-muted-foreground text-sm font-medium">Extract actionable intelligence from academy operations.</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Financial Reporting
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg border-muted/50 overflow-hidden group hover:scale-[1.02] transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <PieChart className="h-4 w-4 text-muted-foreground opacity-30" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">TOTAL ENROLLMENTS</p>
              <div className="text-3xl font-black text-gray-900 font-heading tracking-tighter">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-muted/50 overflow-hidden group hover:scale-[1.02] transition-transform border-t-4 border-t-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-400 opacity-50" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">TOTAL REVENUE</p>
              <div className="text-3xl font-black text-green-700 font-heading tracking-tighter">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-muted/50 overflow-hidden group hover:scale-[1.02] transition-transform border-t-4 border-t-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <Clock className="h-4 w-4 text-orange-400 opacity-50" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">UNSETTLED DUES</p>
              <div className="text-3xl font-black text-orange-700 font-heading tracking-tighter">₹{stats.pendingDues.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-muted/50 overflow-hidden group hover:scale-[1.02] transition-transform border-t-4 border-t-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <BarChart3 className="h-4 w-4 text-red-400 opacity-50 rotate-180" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">CRITICAL ARREARS</p>
              <div className="text-3xl font-black text-red-700 font-heading tracking-tighter">₹{stats.overdueAmount.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Report Generator */}
        <Card className="shadow-2xl border-muted/50 overflow-hidden bg-white/80 backdrop-blur-md">
          <CardHeader className="bg-muted/30 border-b border-muted/50 p-6">
            <CardTitle className="flex items-center gap-3 text-xl font-black font-heading tracking-tight">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <FileText className="h-5 w-5" />
              </div>
              DISBURSEMENT RECONCILIATION & LOGS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">REPORT TYPE CLASSIFICATION</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="h-14 rounded-2xl border-muted/50 bg-white font-bold text-gray-900 focus:ring-indigo-500/20 shadow-sm transition-all text-sm">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-500" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl border-muted/50 font-bold p-2">
                    <SelectItem value="students" className="rounded-xl py-3 cursor-pointer">STUDENT ENROLLMENT LOGS</SelectItem>
                    <SelectItem value="fees" className="rounded-xl py-3 cursor-pointer">FINANCIAL REVENUE REPORTS</SelectItem>
                    <SelectItem value="attendance" className="rounded-xl py-3 cursor-pointer">ACADEMIC ENGAGEMENT LOGS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">STARTING AUDIT DATE</Label>
                <div className="relative group">
                  <CalendarCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    type="date"
                    className="h-14 pl-12 rounded-2xl border-muted/50 bg-white font-black text-gray-900 focus:ring-indigo-500/20 shadow-sm"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">ENDING AUDIT DATE</Label>
                <div className="relative group">
                  <CalendarCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    type="date"
                    className="h-14 pl-12 rounded-2xl border-muted/50 bg-white font-black text-gray-900 focus:ring-indigo-500/20 shadow-sm"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-dashed border-muted/50">
              <div className="space-y-1 max-w-md">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Administrative Notice</p>
                <p className="text-sm font-medium text-muted-foreground">Internal reports are generated as strictly formatted CSV archives compatible with industry-standard spreadsheet software like Microsoft Excel or Apple Numbers.</p>
              </div>
              <Button
                onClick={generateReport}
                disabled={isGenerating}
                className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>SYNTHESIZING...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5" />
                    <span>GENERATE & DOWNLOAD ARCHIVE</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
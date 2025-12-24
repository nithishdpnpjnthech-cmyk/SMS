import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee, TrendingUp, AlertCircle, Search, Plus, Download, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { formatAmount } from "@/lib/currency";

export default function FeesDashboard() {
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollected: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    totalStudents: 0
  });

  useEffect(() => {
    loadFeesData();
  }, []);

  const loadFeesData = async () => {
    try {
      const [feesData, studentsData, dashboardStats] = await Promise.all([
        api.getFees(),
        api.getStudents(),
        api.getDashboardStats()
      ]);
      
      setFees(feesData);
      setStudents(studentsData);
      
      // Calculate fee stats
      const totalCollected = feesData
        .filter(f => f.status === 'paid')
        .reduce((sum, f) => sum + Number(f.amount), 0);
      
      const pendingAmount = feesData
        .filter(f => f.status === 'pending')
        .reduce((sum, f) => sum + Number(f.amount), 0);
      
      const overdueAmount = feesData
        .filter(f => f.status === 'overdue')
        .reduce((sum, f) => sum + Number(f.amount), 0);

      setStats({
        totalCollected,
        pendingAmount,
        overdueAmount,
        totalStudents: studentsData.length
      });

      console.log("Fees data loaded:", { fees: feesData, students: studentsData, stats });
    } catch (error) {
      console.error("Failed to load fees data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const handleExportReport = async () => {
    try {
      const csvContent = convertFeesToCSV(fees, students);
      const filename = `fees_report_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      
      toast({
        title: "Success!",
        description: "Fees report downloaded successfully"
      });
    } catch (error) {
      console.error("Failed to export report:", error);
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  const convertFeesToCSV = (feesData: any[], studentsData: any[]) => {
    const headers = ["Fee ID", "Student Name", "Amount (₹)", "Due Date", "Paid Date", "Status", "Payment Method", "Notes"];
    
    const rows = feesData.map(fee => [
      fee.id || "",
      getStudentName(fee.student_id),
      fee.amount || "",
      fee.due_date ? new Date(fee.due_date).toLocaleDateString() : "",
      fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : "",
      fee.status || "",
      fee.payment_method || "",
      fee.notes || ""
    ]);

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

  const filteredFees = fees.filter(fee => {
    const studentName = getStudentName(fee.student_id);
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fee.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fee.amount?.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "all" || fee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading fees data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Fees & Billing</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage student fees and payment tracking.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={handleExportReport}>
              <Download className="h-4 w-4" />
              <span className="sm:inline">Export Report</span>
            </Button>
            <Link href="/fees/collect" className="w-full sm:w-auto">
              <Button className="gap-2 w-full">
                <Plus className="h-4 w-4" />
                Collect Fee
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Collected</CardTitle>
              <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600">{formatAmount(stats.totalCollected)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending Amount</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-orange-600">{formatAmount(stats.pendingAmount)}</div>
              <p className="text-xs text-muted-foreground">Due soon</p>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Overdue Amount</CardTitle>
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600">{formatAmount(stats.overdueAmount)}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Students</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled</p>
            </CardContent>
          </Card>
        </div>

        {/* Fees Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Records</CardTitle>
            <CardDescription>Track and manage student fee payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by student name, fee ID, or amount..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFees.length > 0 ? (
                    filteredFees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-mono text-xs">{fee.id?.slice(0, 8)}</TableCell>
                        <TableCell className="font-medium">{getStudentName(fee.student_id)}</TableCell>
                        <TableCell>{formatAmount(fee.amount)}</TableCell>
                        <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={fee.status === 'paid' ? 'default' : fee.status === 'overdue' ? 'destructive' : 'secondary'}
                            className={
                              fee.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                              fee.status === 'overdue' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                              'bg-orange-100 text-orange-700 hover:bg-orange-100'
                            }
                          >
                            {fee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{fee.payment_method || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {fee.status !== 'paid' && (
                            <Button size="sm" variant="outline">
                              Collect Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {fees.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No fee records found.</p>
                            <Link href="/fees/collect">
                              <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create First Fee Record
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          "No fees match your search criteria."
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
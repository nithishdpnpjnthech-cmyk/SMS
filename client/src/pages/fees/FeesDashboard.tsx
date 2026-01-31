import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, ArrowUpRight, AlertCircle, Users, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FeesDashboard() {
  const { user, hasPermission } = useAuth();
  const [, navigate] = useLocation();

  if (!hasPermission("fees.read")) {
    return <div className="p-8">Unauthorized</div>;
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["fees-dashboard-stats"],
    queryFn: () => api.get("/api/fees/dashboard")
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["recent-payments"],
    queryFn: () => api.get("/api/payments?limit=5")
  });

  const isLoading = statsLoading || paymentsLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fees & Billing</h1>
            <p className="text-muted-foreground">Manage student fees and payment tracking.</p>
          </div>
          {hasPermission("fees.write") && (
            <Link href="/fees/collect">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Collect Fee
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{stats?.totalCollected?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Lifetime revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">₹{stats?.pendingAmount?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Total outstanding</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{stats?.overdueAmount?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeStudents || 0}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Monthly Fee</TableHead>
                    <TableHead className="text-right">Collection</TableHead>
                    <TableHead className="text-right">Total Pending</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">{payment.student_name}</div>
                        <div className="text-xs text-muted-foreground">{payment.batch}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">₹{parseFloat(payment.total_monthly_fee || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">₹{parseFloat(payment.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium text-orange-600">₹{parseFloat(payment.student_pending_amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm truncate max-w-[150px]">
                        {payment.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions found.</p>
                {hasPermission("fees.write") && (
                  <Link href="/fees/collect">
                    <Button variant="link" className="mt-2 text-primary">
                      Record your first payment
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

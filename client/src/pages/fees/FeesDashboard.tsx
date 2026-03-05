import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Plus, AlertCircle, Users, CheckCircle, IndianRupee,
  Smartphone, Banknote, Calendar, Clock, Filter, Search, RefreshCw,
  TrendingUp, ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentProgram: string;
  studentBatch: string;
  branchName: string;
  amount: number;
  paymentDate: string;
  formattedDate: string;
  formattedTime: string;
  dayName: string;
  month: number;
  year: number;
  monthName: string;
  paymentMethod: 'cash' | 'online';
  notes: string;
}

interface PaymentSummary {
  totalTransactions: number;
  totalAmount: number;
  cashAmount: number;
  onlineAmount: number;
  todayAmount: number;
  todayCount: number;
}

const MONTHS = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function FeesDashboard() {
  const { user, hasPermission } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [dashStats, setDashStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'cash' | 'online'>('all');

  if (!hasPermission("fees.read")) {
    return <div className="p-8">Unauthorized</div>;
  }

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [histData, dashData] = await Promise.all([
        api.getPaymentHistory({
          month: selectedMonth,
          year: selectedYear,
          branchId: user?.role !== 'admin' ? user?.branchId : undefined
        }),
        api.get('/api/fees/dashboard').catch(() => null)
      ]);
      setPayments(histData.payments || []);
      setSummary(histData.summary || null);
      setDashStats(dashData);
    } catch (err) {
      console.error('Failed to load payment data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedYear, user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh when navigating back to this page
  useEffect(() => {
    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  const filteredPayments = payments.filter(p => {
    const matchSearch = !searchTerm ||
      p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.studentPhone?.includes(searchTerm) ||
      p.studentProgram?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = activeFilter === 'all' || p.paymentMethod === activeFilter;
    return matchSearch && matchFilter;
  });

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Loading fee records...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading uppercase">Fees & Billing</h1>
            <p className="text-muted-foreground text-sm">Complete payment ledger — UPI & Cash transactions across all portals.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="font-bold"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            {hasPermission("fees.write") && (
              <Link href="/fees/collect">
                <Button className="shadow-sm font-bold">
                  <Plus className="mr-2 h-4 w-4" /> Collect Fee
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-l-4 border-l-green-500 border-muted/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Today's Collection</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-black text-green-600">₹{(summary?.todayAmount || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">{summary?.todayCount || 0} transactions today</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-primary border-muted/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Month Total</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-black text-primary">₹{(summary?.totalAmount || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">{MONTHS[parseInt(selectedMonth)]} {selectedYear}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-blue-400 border-muted/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">UPI / Online</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-black text-blue-600">₹{(summary?.onlineAmount || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">Razorpay payments</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-amber-400 border-muted/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cash</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-black text-amber-600">₹{(summary?.cashAmount || 0).toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">Front desk collections</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-sm border-muted/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, phone, program..."
                  className="pl-9 h-10 rounded-xl"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Month */}
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="h-10 rounded-xl border border-input px-3 text-sm font-bold bg-white"
              >
                {MONTHS.slice(1).map((m, i) => (
                  <option key={i + 1} value={String(i + 1)}>{m}</option>
                ))}
              </select>

              {/* Year */}
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="h-10 rounded-xl border border-input px-3 text-sm font-bold bg-white"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              {/* Method filter */}
              <div className="flex gap-1 bg-muted/20 p-1 rounded-xl">
                {(['all', 'cash', 'online'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                      activeFilter === f ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f === 'online' ? 'UPI' : f === 'all' ? 'All' : 'Cash'}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Log */}
        <Card className="shadow-sm border-muted/50">
          <CardHeader className="border-b border-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-black uppercase tracking-wide">
                Payment Ledger — {MONTHS[parseInt(selectedMonth)]} {selectedYear}
              </CardTitle>
              <Badge variant="outline" className="font-bold">
                {filteredPayments.length} records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPayments.length > 0 ? (
              <div className="divide-y divide-muted/30">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/20 transition-colors group"
                  >
                    {/* Student Info */}
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-xs font-black",
                        payment.paymentMethod === 'online'
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {payment.studentName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-sm text-gray-900">{payment.studentName}</p>
                          <Badge
                            className={cn(
                              "text-[9px] font-black uppercase border-0 px-2 py-0",
                              payment.paymentMethod === 'online'
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {payment.paymentMethod === 'online' ? (
                              <><Smartphone className="h-2.5 w-2.5 mr-1" />UPI</>
                            ) : (
                              <><Banknote className="h-2.5 w-2.5 mr-1" />Cash</>
                            )}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[10px] text-muted-foreground">
                          <span>{payment.studentProgram || 'General'}</span>
                          {payment.studentBatch && <span>· Batch: {payment.studentBatch}</span>}
                          {payment.branchName && <span>· {payment.branchName}</span>}
                          {payment.studentPhone && <span>· {payment.studentPhone}</span>}
                        </div>
                        {payment.notes && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 italic truncate max-w-xs">{payment.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Amount & Date */}
                    <div className="flex items-center gap-6 mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Date/Time column */}
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="font-bold">{payment.formattedDate}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>{payment.dayName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{payment.formattedTime}</span>
                        </div>
                      </div>

                      {/* Amount column */}
                      <div className="text-right">
                        <p className="text-lg font-black text-gray-900">₹{Number(payment.amount).toLocaleString('en-IN')}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-green-600">SUCCESS</p>
                      </div>

                      <Link href={`/students/${payment.studentId}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors hidden sm:block" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <IndianRupee className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No payments found for this period.</p>
                {hasPermission("fees.write") && (
                  <Link href="/fees/collect">
                    <Button variant="link" className="mt-2 text-primary font-bold">
                      Collect a fee payment →
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

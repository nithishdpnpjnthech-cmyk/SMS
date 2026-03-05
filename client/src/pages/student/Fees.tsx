import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  IndianRupee,
  Clock,
  CheckCircle,
  Calendar,
  ShieldCheck,
  Loader2,
  ChevronRight,
  Smartphone,
  Banknote,
  AlertCircle,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';
import { studentApi } from '@/lib/student-api';
import { useToast } from '@/hooks/use-toast';
import { useStudentAuth } from '@/lib/student-auth';
import { cn } from '@/lib/utils';

declare global {
  interface Window { Razorpay: any; }
}

interface FeeRecord {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: string;
  notes?: string;
  createdAt?: string;
}

interface EnrollmentRecord {
  id: string;
  studentId: string;
  feeStructureId: string;
  programName: string;
  monthlyAmount: number;
  status: string;
}

interface FeesData {
  fees: FeeRecord[];
  enrollments: EnrollmentRecord[];
  summary: { totalFee: number; paidAmount: number; pendingAmount: number; };
}

interface EligibilityInfo {
  canPayMonthly: boolean;
  canPayQuarterly: boolean;
  monthlyPaidInfo: { amount: number; date: string; method: string; nextDue: string } | null;
  quarterlyPaidInfo: { amount: number; date: string; method: string; nextDue: string } | null;
}

export default function StudentFees() {
  const { toast } = useToast();
  const [feesData, setFeesData] = useState<FeesData | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { student } = useStudentAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [data, elig] = await Promise.all([
        studentApi.getFees(),
        studentApi.getPaymentEligibility()
      ]);
      setFeesData(data as FeesData);
      setEligibility(elig as EligibilityInfo);
    } catch (error) {
      console.error('Failed to load fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpiPayment = async (enrollment: EnrollmentRecord, type: 'monthly' | 'quarterly') => {
    if (!eligibility) return;

    // Enforce payment cycle
    if (type === 'monthly' && !eligibility.canPayMonthly) {
      toast({
        title: 'Already Paid This Month',
        description: `Monthly fee paid on ${new Date(eligibility.monthlyPaidInfo!.date).toLocaleDateString('en-IN')}. Next due: ${new Date(eligibility.monthlyPaidInfo!.nextDue!).toLocaleDateString('en-IN')}`,
        variant: 'destructive',
      });
      return;
    }
    if (type === 'quarterly' && !eligibility.canPayQuarterly) {
      toast({
        title: 'Quarterly Fee Already Paid',
        description: `Quarterly fee paid on ${new Date(eligibility.quarterlyPaidInfo!.date).toLocaleDateString('en-IN')}. Next due: ${new Date(eligibility.quarterlyPaidInfo!.nextDue!).toLocaleDateString('en-IN')}`,
        variant: 'destructive',
      });
      return;
    }

    setPaymentLoading(true);
    try {
      const order = await studentApi.initiateSubscription(enrollment.feeStructureId, type);

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'HUURA ACADEMY',
        description: `${type === 'monthly' ? 'Monthly' : 'Quarterly'} Fee - ${enrollment.programName}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await studentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              feeId: order.feeId
            });

            toast({
              title: '✅ Payment Successful!',
              description: `₹${type === 'monthly' ? enrollment.monthlyAmount : (enrollment.monthlyAmount * 3 - 500)} paid via UPI successfully.`,
            });

            await loadAll();
          } catch (err: any) {
            toast({
              title: 'Verification Failed',
              description: err.message || 'Payment verification failed. Please contact staff.',
              variant: 'destructive',
            });
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: student?.name || '',
          email: student?.email || '',
          contact: student?.phone || '',
        },
        theme: { color: '#f97316' },
        modal: {
          ondismiss: () => setPaymentLoading(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (res: any) => {
        toast({
          title: 'Payment Failed',
          description: res.error.description,
          variant: 'destructive',
        });
        setPaymentLoading(false);
      });
      rzp.open();
    } catch (error: any) {
      const msg = error.message || 'Could not start payment process';
      // Show friendly message for already-paid cycle errors
      if (error.message?.includes('already paid') || error.message?.includes('Already Paid')) {
        toast({ title: 'Payment Not Required', description: msg, variant: 'destructive' });
      } else {
        toast({ title: 'Initialization Failed', description: msg, variant: 'destructive' });
      }
      setPaymentLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        day: d.toLocaleDateString('en-IN', { weekday: 'long' })
      };
    } catch { return { date: dateStr, time: '', day: '' }; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Loading your fee details...</p>
        </div>
      </div>
    );
  }

  if (!feesData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-500">Failed to load fees data. Please refresh.</p>
      </div>
    );
  }

  const paidThisMonth = eligibility && !eligibility.canPayMonthly;
  const paidQuarterly = eligibility && !eligibility.canPayQuarterly;

  return (
    <div className="space-y-8 px-1 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-muted/30 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight font-heading">Fees & Payments</h1>
          <p className="text-muted-foreground text-sm max-w-md">Pay securely via UPI/Net Banking. Cash payments are recorded at the front desk.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col items-center bg-green-50 px-5 py-3 rounded-2xl border border-green-100">
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Paid</p>
            <p className="text-xl font-black text-green-700">₹{feesData.summary.paidAmount.toLocaleString('en-IN')}</p>
          </div>
          {feesData.summary.pendingAmount > 0 && (
            <div className="flex flex-col items-center bg-orange-50 px-5 py-3 rounded-2xl border border-orange-100">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">Pending</p>
              <p className="text-xl font-black text-orange-700">₹{feesData.summary.pendingAmount.toLocaleString('en-IN')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-muted/20 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('plans')}
          className={cn(
            "px-5 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'plans' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Pay Now
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-5 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'history' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Transaction History
        </button>
      </div>

      {/* === PAY NOW TAB === */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Payment cycle status */}
          {(paidThisMonth || paidQuarterly) && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-green-900">Payments Up to Date</h3>
                {paidThisMonth && eligibility?.monthlyPaidInfo && (
                  <p className="text-sm text-green-700 mt-0.5">
                    Monthly fee of ₹{Number(eligibility.monthlyPaidInfo.amount).toLocaleString('en-IN')} paid on {formatDate(eligibility.monthlyPaidInfo.date)} via {eligibility.monthlyPaidInfo.method || 'UPI'}.
                    Next due: <strong>{formatDate(eligibility.monthlyPaidInfo.nextDue)}</strong>
                  </p>
                )}
                {paidQuarterly && eligibility?.quarterlyPaidInfo && (
                  <p className="text-sm text-green-700 mt-0.5">
                    Quarterly fee of ₹{Number(eligibility.quarterlyPaidInfo.amount).toLocaleString('en-IN')} paid on {formatDate(eligibility.quarterlyPaidInfo.date)}.
                    Next due: <strong>{formatDate(eligibility.quarterlyPaidInfo.nextDue)}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cash payment notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Banknote className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">Cash Payment?</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Visit the front desk to pay by cash. The receptionist or manager will record your payment and it will appear in your transaction history automatically.
              </p>
            </div>
          </div>

          {feesData.enrollments.length > 0 ? (
            <div className="space-y-5">
              {feesData.enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden border-muted/50 shadow-md rounded-3xl">
                  <CardContent className="p-0">
                    <div className="p-6 bg-gradient-to-br from-orange-50/50 to-white border-b border-muted/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">Active Program</p>
                          <h3 className="text-xl font-black text-gray-900">{enrollment.programName}</h3>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Sparkles className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Monthly Plan */}
                      <div className={cn(
                        "p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4",
                        paidThisMonth
                          ? "bg-gray-50 border-gray-200 opacity-60"
                          : "bg-white border-orange-200 hover:border-orange-400 hover:shadow-md"
                      )}>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Monthly Plan</p>
                            {paidThisMonth && (
                              <Badge className="bg-green-100 text-green-700 text-[9px] border-0 px-2">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" /> PAID
                              </Badge>
                            )}
                          </div>
                          <div className="text-3xl font-black text-gray-900 flex items-start">
                            <span className="text-base mt-1 mr-0.5 opacity-50">₹</span>
                            {Number(enrollment.monthlyAmount).toLocaleString('en-IN')}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Billed every calendar month</p>
                          {paidThisMonth && eligibility?.monthlyPaidInfo && (
                            <p className="text-[10px] text-green-600 font-bold mt-1">
                              Next due: {formatDate(eligibility.monthlyPaidInfo.nextDue)}
                            </p>
                          )}
                        </div>

                        {paidThisMonth ? (
                          <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl">
                            <Lock className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs font-bold text-green-700">Already paid this month</span>
                          </div>
                        ) : (
                          <Button
                            className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 flex items-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-all"
                            onClick={() => handleUpiPayment(enrollment, 'monthly')}
                            disabled={paymentLoading}
                          >
                            {paymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                            Pay via UPI
                          </Button>
                        )}
                      </div>

                      {/* Quarterly Plan */}
                      <div className={cn(
                        "p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4 relative",
                        paidQuarterly
                          ? "bg-gray-50 border-gray-200 opacity-60"
                          : "bg-white border-primary/40 hover:border-primary hover:shadow-md"
                      )}>
                        {!paidQuarterly && (
                          <Badge className="absolute -top-3 right-4 bg-green-500 text-white text-[9px] border-0 px-3 shadow-md">
                            Save ₹500
                          </Badge>
                        )}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Quarterly Plan</p>
                            {paidQuarterly && (
                              <Badge className="bg-green-100 text-green-700 text-[9px] border-0 px-2">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" /> PAID
                              </Badge>
                            )}
                          </div>
                          <div className="text-3xl font-black text-gray-900 flex items-start">
                            <span className="text-base mt-1 mr-0.5 opacity-50">₹</span>
                            {(Number(enrollment.monthlyAmount) * 3 - 500).toLocaleString('en-IN')}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Covers 3 months (save ₹500)</p>
                          {paidQuarterly && eligibility?.quarterlyPaidInfo && (
                            <p className="text-[10px] text-green-600 font-bold mt-1">
                              Next due: {formatDate(eligibility.quarterlyPaidInfo.nextDue)}
                            </p>
                          )}
                        </div>

                        {paidQuarterly ? (
                          <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl">
                            <Lock className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-xs font-bold text-green-700">Covered for 3 months</span>
                          </div>
                        ) : (
                          <Button
                            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-bold h-11 flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            onClick={() => handleUpiPayment(enrollment, 'quarterly')}
                            disabled={paymentLoading}
                          >
                            {paymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                            Pay via UPI
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Security note */}
                    <div className="px-6 pb-5 flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <span>Secured by Razorpay · UPI · Cards · Net Banking</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted/50 bg-muted/5">
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <p className="text-lg font-bold text-muted-foreground">No active enrollments found.</p>
                <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-1">Please contact the administration to enroll in a program.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* === HISTORY TAB === */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {feesData.fees.length > 0 ? (
            feesData.fees.map((fee) => {
              const dt = formatDateTime(fee.paidDate || fee.dueDate);
              const isPaid = fee.status === 'paid';
              return (
                <div
                  key={fee.id}
                  className={cn(
                    "flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border transition-all",
                    isPaid
                      ? "bg-white border-green-100 hover:border-green-300"
                      : "bg-orange-50/30 border-orange-100 hover:border-orange-300"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-11 w-11 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      isPaid ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                    )}>
                      {isPaid ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{fee.notes || 'Fee Payment'}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {isPaid && fee.paidDate && (
                          <>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {dt.date} · {dt.day}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {dt.time}
                            </span>
                          </>
                        )}
                        {!isPaid && (
                          <span className="text-[10px] text-orange-600 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(fee.dueDate)}
                          </span>
                        )}
                        {fee.paymentMethod && (
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                            fee.paymentMethod === 'online' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                          )}>
                            {fee.paymentMethod === 'online' ? '📱 UPI' : '💵 CASH'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-900">₹{Number(fee.amount).toLocaleString('en-IN')}</p>
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        isPaid ? "text-green-600" : "text-orange-500"
                      )}>
                        {isPaid ? '✓ SUCCESS' : 'PENDING'}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 hidden sm:block" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-14 bg-muted/5 rounded-3xl border border-dashed border-muted/50">
              <Info className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium italic">No transaction history yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
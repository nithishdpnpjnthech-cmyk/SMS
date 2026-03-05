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
  ChevronRight
} from 'lucide-react';
import { studentApi } from '@/lib/student-api';
import { useToast } from '@/hooks/use-toast';
import { useStudentAuth } from '@/lib/student-auth';
import { cn } from '@/lib/utils';

interface FeeRecord {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: string;
  notes?: string;
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
  summary: {
    totalFee: number;
    paidAmount: number;
    pendingAmount: number;
  };
}

export default function StudentFees() {
  const { toast } = useToast();
  const [feesData, setFeesData] = useState<FeesData | null>(null);
  const [loading, setLoading] = useState(true);
  const { student } = useStudentAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    try {
      const data = await studentApi.getFees();
      setFeesData(data as FeesData);
    } catch (error) {
      console.error('Failed to load fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionPayment = async (enrollment: EnrollmentRecord, type: 'monthly' | 'quarterly') => {
    setPaymentLoading(true);
    try {
      const order = await studentApi.initiateSubscription(enrollment.feeStructureId, type);

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "HUURA ACADEMY",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} Fee - ${enrollment.programName}`,
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
              title: 'Payment Successful',
              description: 'Your subscription has been updated successfully.',
            });

            await loadFees();
          } catch (err: any) {
            toast({
              title: 'Verification Failed',
              description: err.message || 'Payment verification failed',
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
        theme: { color: "#f97316" },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast({
          title: 'Payment Failed',
          description: response.error.description,
          variant: 'destructive',
        });
        setPaymentLoading(false);
      });
      rzp.open();

    } catch (error: any) {
      toast({
        title: 'Initialization Failed',
        description: error.message || 'Could not start payment process',
        variant: 'destructive',
      });
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!feesData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load fees data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-1 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-muted/30 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight font-heading">Fees & Payments</h1>
          <p className="text-muted-foreground text-base max-w-md">Complete your course payments securely using our flexible subscription plans.</p>
        </div>
        <div className="flex items-center gap-4 bg-orange-50 px-6 py-4 rounded-2xl border border-orange-100 shadow-sm">
          <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-orange-700/70 uppercase tracking-widest">Completed Payments</p>
            <p className="text-2xl font-black text-orange-900 font-heading tracking-tight">₹{feesData.summary.paidAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Subscription Plans Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Course Pricing & Subscriptions</h2>
        </div>

        {feesData.enrollments.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {feesData.enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="overflow-hidden border-muted/50 shadow-md hover:shadow-xl transition-all duration-500 rounded-3xl group">
                <CardContent className="p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 sm:p-8 bg-gradient-to-br from-white to-muted/10 flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Active Program</p>
                          <h3 className="text-2xl font-black text-gray-900 font-heading">{enrollment.programName}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                          <CreditCard className="h-6 w-6" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white border border-muted/50 hover:border-primary/50 transition-all cursor-default shadow-sm hover:shadow-md h-full flex flex-col justify-between group/plan">
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Monthly Plan</p>
                            <div className="text-2xl font-black text-gray-900 flex items-center">
                              <span className="text-sm mr-0.5 opacity-50">₹</span>{Number(enrollment.monthlyAmount).toLocaleString('en-IN')}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Billed every month</p>
                          </div>
                          <Button
                            className="w-full mt-4 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white border-orange-200 transition-all font-bold h-10 active:scale-95"
                            onClick={() => handleSubscriptionPayment(enrollment, 'monthly')}
                            disabled={paymentLoading}
                          >
                            Select Monthly
                          </Button>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-muted/50 hover:border-primary/50 transition-all cursor-default shadow-sm hover:shadow-md h-full flex flex-col justify-between group/plan">
                          <div className="relative">
                            <Badge className="absolute -top-6 -right-2 bg-green-500 text-[9px] font-black uppercase text-white border-none px-2 py-0.5 shadow-sm">Save ₹500</Badge>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Quarterly Plan</p>
                            <div className="text-2xl font-black text-gray-900 flex items-center">
                              <span className="text-sm mr-0.5 opacity-50">₹</span>{(Number(enrollment.monthlyAmount) * 3 - 500).toLocaleString('en-IN')}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Billed every 3 months</p>
                          </div>
                          <Button
                            className="w-full mt-4 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-bold h-10 active:scale-95"
                            onClick={() => handleSubscriptionPayment(enrollment, 'quarterly')}
                            disabled={paymentLoading}
                          >
                            Select Quarterly
                          </Button>
                        </div>
                      </div>
                    </div>
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
              <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">Please contact the administration to enroll in a course program.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 max-w-2xl">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-sm text-blue-900">100% Secure Payments</p>
          <p className="text-xs text-blue-700/70 font-medium leading-relaxed">
            All payments are processed securely via Razorpay. We support UPI, Cards, and Net Banking. Your data is protected with industry-standard encryption.
          </p>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-2 px-2">
          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          <h2 className="text-md font-bold text-muted-foreground uppercase tracking-wider">Transaction History</h2>
        </div>

        {feesData.fees.length > 0 ? (
          <div className="space-y-3">
            {feesData.fees.map((fee) => (
              <div key={fee.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border border-muted/50 rounded-2xl hover:border-primary/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    fee.status === 'paid' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {fee.status === 'paid' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{fee.notes || 'Institutional Fee'}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3" />
                        {new Date(fee.dueDate).toLocaleDateString()}
                      </p>
                      {fee.paymentMethod && (
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-muted/30 px-1.5 py-0.5 rounded">
                          {fee.paymentMethod}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-base font-black text-gray-900">₹{Number(fee.amount).toLocaleString('en-IN')}</p>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      fee.status === 'paid' ? "text-green-600" : "text-orange-600"
                    )}>
                      {fee.status === 'paid' ? 'SUCCESS' : 'PENDING'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-muted/5 rounded-3xl border border-dashed border-muted/50">
            <p className="text-sm text-muted-foreground font-medium italic">No transaction history available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
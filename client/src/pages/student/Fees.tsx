import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Building2,
  Calendar
} from 'lucide-react';
import { studentApi } from '@/lib/student-api';
import { useToast } from '@/hooks/use-toast';

interface FeeRecord {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: string;
  notes?: string;
}

interface FeesData {
  fees: FeeRecord[];
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
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
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

  const handlePayment = async () => {
    if (!selectedFee || !paymentMethod) {
      toast({
        title: 'Error',
        description: 'Please select a payment method',
        variant: 'destructive',
      });
      return;
    }

    setPaymentLoading(true);
    try {
      await studentApi.processPayment(selectedFee.id, paymentMethod);
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully',
      });
      setPaymentDialog(false);
      setSelectedFee(null);
      setPaymentMethod('');
      await loadFees(); // Reload fees data
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'Payment could not be processed',
        variant: 'destructive',
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const openPaymentDialog = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPaymentDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
    <div className="space-y-8 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/50 p-4 sm:p-6 rounded-2xl border border-muted/50 backdrop-blur-sm shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-heading">Fees & Payments</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your tuition and other institutional fees.</p>
        </div>
        <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shadow-sm">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-700/70 uppercase tracking-widest">PENDING DUES</p>
            <p className="text-xl font-black text-blue-900 font-heading">₹{feesData.summary.pendingAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Fee Records */}
      <div className="space-y-6">
        {feesData.fees.length > 0 ? (
          feesData.fees.map((fee) => (
            <Card key={fee.id} className={`group overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-muted/50 ${fee.status === 'paid'
              ? 'hover:border-green-300'
              : fee.status === 'overdue'
                ? 'hover:border-red-300'
                : 'hover:border-orange-300'
              }`}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-stretch">
                  <div className={`w-full h-1 sm:w-2 sm:h-auto ${fee.status === 'paid'
                    ? 'bg-green-500'
                    : fee.status === 'overdue'
                      ? 'bg-red-500'
                      : 'bg-orange-500'
                    }`}></div>

                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 group-hover:scale-110 transition-transform">
                          {fee.status === 'paid' ? (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          ) : (
                            <Clock className="h-6 w-6 text-orange-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="sm:hidden">
                              {fee.status === 'paid' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 truncate font-heading group-hover:text-primary transition-colors">
                              {fee.notes || 'Institutional Fee'}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Due: {new Date(fee.dueDate).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}</span>
                            </div>
                            {fee.paidDate && (
                              <div className="flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 text-[10px] font-bold text-green-700">
                                <CheckCircle className="h-3 w-3" />
                                PAID ON {new Date(fee.paidDate).toLocaleDateString('en-IN').toUpperCase()}
                              </div>
                            )}
                            {fee.paymentMethod && (
                              <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-full border border-muted/50 text-[10px] font-bold text-muted-foreground uppercase">
                                VIA {fee.paymentMethod}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row items-center justify-between md:justify-end gap-6 sm:gap-8 border-t md:border-none pt-5 md:pt-0 mt-2 md:mt-0">
                        <div className="md:text-right">
                          <div className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center md:justify-end font-heading tracking-tight">
                            <IndianRupee className="h-5 w-5 mr-0.5 text-muted-foreground" />
                            {fee.amount.toLocaleString('en-IN')}
                          </div>
                          <Badge
                            variant="outline"
                            className={`mt-1 font-bold px-3 py-0.5 border-none shadow-sm ${fee.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : fee.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-orange-100 text-orange-800'
                              }`}
                          >
                            {fee.status === 'paid' ? 'SUCCESS' : fee.status === 'overdue' ? 'OVERDUE' : 'PENDING'}
                          </Badge>
                        </div>

                        {fee.status === 'pending' && (
                          <Button
                            onClick={() => openPaymentDialog(fee)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition-all px-6 py-5 rounded-xl text-sm font-bold"
                          >
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="shadow-lg border-muted/50 overflow-hidden">
            <CardContent className="text-center py-20">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-50 shadow-inner">
                <CreditCard className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Fee Records Found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">Your fee payment history and pending dues will appear here once generated.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <DialogHeader className="p-6 bg-blue-600 text-white">
            <DialogTitle className="flex items-center gap-2 text-xl font-heading">
              <CreditCard className="h-6 w-6" />
              Pay Fee Online
            </DialogTitle>
            <DialogDescription className="text-blue-100 pt-1">
              Complete your payment for ₹{selectedFee?.amount.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-6 shadow-inner text-center">
              <p className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] mb-2">Total Payable Amount</p>
              <div className="text-4xl font-black text-blue-900 font-heading tracking-tight">
                <span className="text-2xl mr-1 opacity-60">₹</span>
                {selectedFee?.amount.toLocaleString('en-IN')}
              </div>
              {selectedFee && (
                <p className="text-xs font-bold text-blue-700/60 mt-2 uppercase">
                  Due by: {new Date(selectedFee.dueDate).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest pl-2">Payment Channels</h4>

              <div className="grid gap-3">
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`group p-4 border-2 rounded-2xl text-left transition-all duration-200 ${paymentMethod === 'upi'
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500/20'
                    : 'border-muted/50 hover:border-blue-200 hover:bg-muted/10'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${paymentMethod === 'upi' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">UPI Payment</p>
                      <p className="text-xs text-muted-foreground font-medium">GPay, PhonePe, Paytm & Mobile Apps</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`group p-4 border-2 rounded-2xl text-left transition-all duration-200 ${paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500/20'
                    : 'border-muted/50 hover:border-blue-200 hover:bg-muted/10'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${paymentMethod === 'card' ? 'bg-blue-100 text-blue-600' : 'bg-blue-100 text-blue-600'}`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Credit/Debit Cards</p>
                      <p className="text-xs text-muted-foreground font-medium">Secure payment via all major networks</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`group p-4 border-2 rounded-2xl text-left transition-all duration-200 ${paymentMethod === 'netbanking'
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500/20'
                    : 'border-muted/50 hover:border-blue-200 hover:bg-muted/10'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${paymentMethod === 'netbanking' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Net Banking</p>
                      <p className="text-xs text-muted-foreground font-medium">Direct payment from your bank account</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-muted/50">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Your payment is secured with industry-standard encryption. Redirecting to payment gateway...
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentDialog(false);
                  setSelectedFee(null);
                  setPaymentMethod('');
                }}
                className="flex-1 h-12 rounded-xl font-bold border-muted/50 hover:bg-muted/10"
                disabled={paymentLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!paymentMethod || paymentLoading}
                className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all active:scale-95"
              >
                {paymentLoading ? 'Processing...' : 'Complete Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
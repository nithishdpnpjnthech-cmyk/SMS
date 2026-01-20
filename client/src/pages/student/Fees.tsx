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
  Building2
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
      setFeesData(data);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fees & Payments</h1>
        <p className="text-gray-600 mt-2">Manage your tuition and other institutional fees.</p>
      </div>

      {/* Fee Records */}
      <div className="space-y-4">
        {feesData.fees.length > 0 ? (
          feesData.fees.map((fee) => (
            <Card key={fee.id} className={`border-l-4 ${
              fee.status === 'paid' 
                ? 'border-l-green-500' 
                : fee.status === 'overdue'
                ? 'border-l-red-500'
                : 'border-l-orange-500'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {fee.status === 'paid' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <Clock className="h-6 w-6 text-orange-500" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {fee.notes || 'Tuition Fee'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(fee.dueDate).toLocaleDateString('en-IN', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      {fee.paidDate && (
                        <p className="text-sm text-green-600">
                          Paid on: {new Date(fee.paidDate).toLocaleDateString('en-IN')}
                        </p>
                      )}
                      {fee.paymentMethod && (
                        <p className="text-sm text-gray-600 capitalize">
                          Payment method: {fee.paymentMethod}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 flex items-center">
                        <IndianRupee className="h-5 w-5 mr-1" />
                        {fee.amount.toLocaleString('en-IN')}
                      </div>
                      <Badge 
                        variant={fee.status === 'paid' ? 'default' : 'secondary'}
                        className={
                          fee.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : fee.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }
                      >
                        {fee.status === 'paid' ? 'Paid' : fee.status === 'overdue' ? 'Overdue' : 'Unpaid'}
                      </Badge>
                    </div>
                    
                    {fee.status === 'pending' && (
                      <Button 
                        onClick={() => openPaymentDialog(fee)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No fee records found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pay Fee Online
            </DialogTitle>
            <DialogDescription>
              Choose your preferred payment method to pay ₹{selectedFee?.amount.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Amount to Pay:</span>
                <span className="text-2xl font-bold text-blue-600 flex items-center">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {selectedFee?.amount.toLocaleString('en-IN')}
                </span>
              </div>
              {selectedFee && (
                <p className="text-sm text-gray-600 mt-1">
                  Due Date: {new Date(selectedFee.dueDate).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Select Payment Method</h4>
              
              <div className="grid gap-3">
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded">
                      <Smartphone className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold">UPI Payment</p>
                      <p className="text-sm text-gray-600">Pay using UPI apps like GPay, PhonePe, Paytm</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Debit/Credit Card</p>
                      <p className="text-sm text-gray-600">Pay using your debit or credit card</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded">
                      <Building2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Net Banking</p>
                      <p className="text-sm text-gray-600">Pay directly from your bank account</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your payment will be processed securely. You will receive a confirmation once the payment is successful.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setPaymentDialog(false);
                  setSelectedFee(null);
                  setPaymentMethod('');
                }}
                className="flex-1"
                disabled={paymentLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePayment}
                disabled={!paymentMethod || paymentLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {paymentLoading ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
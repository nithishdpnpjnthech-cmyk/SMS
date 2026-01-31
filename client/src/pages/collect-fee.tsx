import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

interface Student {
  id: string;
  name: string;
  phone: string;
  program: string;
  batch: string;
  monthly_fee: number;
}

interface FeeCalculation {
  studentId: string;
  courses: Array<{ name: string; monthly_fee: number }>;
  monthlyFee: number;
  totalPaid: number;
  pendingAmount: number;
  overdueAmount: number;
  suggestedAmount: number;
}

export default function CollectFee() {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculation | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get auth headers from localStorage or context
  const getAuthHeaders = () => {
    const userId = localStorage.getItem('userId') || '';
    const userRole = localStorage.getItem('userRole') || '';
    const userBranch = localStorage.getItem('userBranch') || '';
    
    return {
      'x-user-id': userId,
      'x-user-role': userRole,
      'x-user-branch': userBranch,
    };
  };

  // Search students with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchStudents();
      } else {
        setStudents([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchStudents = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError('');
    
    try {
      const results = await api.get(
        `/api/students/search?q=${encodeURIComponent(searchQuery)}`,
        getAuthHeaders()
      );
      setStudents(results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search students');
      setStudents([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStudentSelect = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    setSelectedStudent(student);
    setIsCalculating(true);
    setError('');

    try {
      const calculation = await api.get(
        `/api/students/${studentId}/fee-calculation`,
        getAuthHeaders()
      );
      setFeeCalculation(calculation);
      setAmount(calculation.suggestedAmount.toString());
    } catch (err) {
      console.error('Fee calculation error:', err);
      setError('Failed to calculate fees');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !amount || !paymentMethod) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.post(
        '/api/fees/collect',
        {
          studentId: selectedStudent.id,
          amount: parseFloat(amount),
          paymentMethod,
          notes: notes.trim() || null,
        },
        getAuthHeaders()
      );

      setSuccess(`Fee collected successfully! Amount: ₹${amount}`);
      
      // Reset form
      setSelectedStudent(null);
      setFeeCalculation(null);
      setAmount('');
      setPaymentMethod('');
      setNotes('');
      setSearchQuery('');
      setStudents([]);
    } catch (err) {
      console.error('Fee collection error:', err);
      setError('Failed to collect fee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setFeeCalculation(null);
    setAmount('');
    setPaymentMethod('');
    setNotes('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Collect Fee</h1>
        <p className="text-muted-foreground">Search for a student and collect their fee payment</p>
      </div>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Student
            </CardTitle>
            <CardDescription>
              Search by name, phone, or email to find the student
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">Student Search</Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Enter name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                )}
              </div>
            </div>

            {students.length > 0 && (
              <div>
                <Label>Select Student</Label>
                <Select onValueChange={handleStudentSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {student.phone} • {student.program}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStudent && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <h4 className="font-semibold">{selectedStudent.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedStudent.phone} • {selectedStudent.program} • {selectedStudent.batch}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Fee Collection Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fee Collection
            </CardTitle>
            <CardDescription>
              Enter payment details and collect the fee
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedStudent ? (
              <p className="text-muted-foreground text-center py-8">
                Please search and select a student first
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isCalculating ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Calculating fees...</span>
                  </div>
                ) : feeCalculation ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Monthly Fee:</span>
                        <p className="font-semibold">₹{feeCalculation.monthlyFee}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending:</span>
                        <p className="font-semibold text-orange-600">₹{feeCalculation.pendingAmount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Paid:</span>
                        <p className="font-semibold text-green-600">₹{feeCalculation.totalPaid}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Overdue:</span>
                        <p className="font-semibold text-red-600">₹{feeCalculation.overdueAmount}</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label>Payment Method *</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any notes about this payment..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !amount || !paymentMethod}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Collect ₹${amount || '0'}`
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Reset
                      </Button>
                    </div>
                  </div>
                ) : null}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
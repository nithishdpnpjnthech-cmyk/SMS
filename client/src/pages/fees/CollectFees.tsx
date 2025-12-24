import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Search, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function CollectFees() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [studentDues, setStudentDues] = useState<any>(null);
  const [loadingDues, setLoadingDues] = useState(false);
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();

  const loadStudentDues = async (studentId: string) => {
    if (!studentId) {
      setStudentDues(null);
      return;
    }
    
    setLoadingDues(true);
    try {
      const dues = await api.getStudentDues(studentId);
      setStudentDues(dues);
      
      // Set amount to pending due if exists
      if (dues.pendingDue > 0) {
        setAmount(dues.pendingDue.toString());
      }
    } catch (error) {
      console.error("Failed to load student dues:", error);
      setStudentDues(null);
    } finally {
      setLoadingDues(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
    setAmount("");
    loadStudentDues(studentId);
  };

  useEffect(() => {
    if (!hasPermission('fees.write')) {
      setLocation('/dashboard');
      return;
    }
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const studentsData = await api.getStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error("Failed to load students:", error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !amount) {
      toast({
        title: "Error",
        description: "Please select a student and enter amount",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const feeData = {
        studentId: selectedStudent,
        amount: parseFloat(amount),
        dueDate: new Date(),
        paidDate: new Date(),
        status: "paid",
        paymentMethod,
        notes
      };

      await api.createFee(feeData);
      
      toast({
        title: "Success!",
        description: "Fee collected successfully"
      });

      // Reset form
      setSelectedStudent("");
      setAmount("");
      setNotes("");
      setSearchTerm("");
    } catch (error: any) {
      console.error("Failed to collect fee:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to collect fee",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-0">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Collect Fee</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Record fee payment from student</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Selection */}
              <div className="space-y-2">
                <Label>Select Student *</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search student by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedStudent} onValueChange={handleStudentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} - {student.program} ({student.batch})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Student Info Display */}
              {selectedStudentData && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                  <h3 className="font-semibold mb-2">Student Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedStudentData.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Program:</span>
                      <p className="font-medium">{selectedStudentData.program}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Batch:</span>
                      <p className="font-medium">{selectedStudentData.batch}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{selectedStudentData.phone}</p>
                    </div>
                  </div>
                  
                  {/* Dues Information */}
                  {loadingDues && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                      Loading dues information...
                    </div>
                  )}
                  
                  {studentDues && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Fee Status</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Paid:</span>
                          <p className="font-medium text-green-600">₹{studentDues.totalPaid}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pending Due:</span>
                          <p className="font-medium text-orange-600">₹{studentDues.pendingDue}</p>
                        </div>
                        {studentDues.overdueAmount > 0 && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Overdue Amount:</span>
                            <p className="font-medium text-red-600">₹{studentDues.overdueAmount}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              <div>
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="Enter fee amount in rupees"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/fees")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Collect Fee
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
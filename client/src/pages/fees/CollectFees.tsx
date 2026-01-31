import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Search, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function CollectFees() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  // Search State
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Selection State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [persistedStudent, setPersistedStudent] = useState<any>(null);

  // Form State
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const [studentDues, setStudentDues] = useState<any>(null);
  const [loadingDues, setLoadingDues] = useState(false);

  // 🔐 Permission check
  useEffect(() => {
    if (!hasPermission("fees.write")) {
      navigate("/dashboard");
    }
  }, []);

  // 🔍 SEARCH STUDENTS (Robust Implementation)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setAllStudents([]);
        return;
      }

      console.log("DEBUG: Search initiates for:", searchTerm);
      try {
        const res = await fetch(
          `/api/students/search?q=${encodeURIComponent(searchTerm.trim())}`,
          {
            headers: {
              "x-user-role": user?.role || "",
              "x-user-id": user?.id || "",
              "x-user-branch": user?.branchId || "",
            },
          }
        );

        console.log("DEBUG: Search API Status:", res.status);
        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();
        console.log("DEBUG: Search Data:", data);
        setAllStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("DEBUG: Search Error", err);
        // Only show toast on actual errors, not empty results
        toast({
          title: "Error",
          description: "Failed to search students",
          variant: "destructive",
        });
        setAllStudents([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, user]);

  // 📊 Load fee calculation
  const loadStudentDues = async (studentId: string) => {
    if (!studentId) return;

    setLoadingDues(true);
    try {
      const res = await fetch(
        `/api/students/${studentId}/fee-calculation`,
        {
          headers: {
            "x-user-role": user?.role || "",
            "x-user-id": user?.id || "",
            "x-user-branch": user?.branchId || "",
          },
        }
      );
      const dues = await res.json();
      setStudentDues(dues);

      if (dues?.suggestedAmount > 0) {
        setAmount(dues.suggestedAmount.toString());
      }
    } catch (err) {
      console.error(err);
      setStudentDues(null);
    } finally {
      setLoadingDues(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    console.log("DEBUG: Selected Student ID:", studentId);
    setSelectedStudentId(studentId);

    // Persist logic: find the student object so we can keep displaying it
    const student = allStudents.find(s => s.id === studentId);
    if (student) {
      setPersistedStudent(student);
      // Optional: Update search term to match selection to avoid confusion
      // setSearchTerm(student.name); 
    }

    setAmount("");
    loadStudentDues(studentId);
  };

  // Determine which student data to show (persisted takes precedence if ID matches)
  const selectedStudentData = (persistedStudent?.id === selectedStudentId)
    ? persistedStudent
    : allStudents.find((s) => s.id === selectedStudentId);

  // 💾 Collect Fee
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("DEBUG: Submitting Fee", { selectedStudentId, amount });

    if (!selectedStudentId || !amount) {
      toast({
        title: "Error",
        description: "Please select a student and enter amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        studentId: selectedStudentId,
        amount: Number(amount),
        paymentMethod,
        notes,
      };

      console.log("DEBUG: Payload", payload);

      const res = await fetch("/api/fees/collect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-id": user?.id || "",
          "x-user-branch": user?.branchId || "",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast({
        title: "Success",
        description: `Fee collected successfully${result.remainingCredit > 0 ? `. Credit remaining: ₹${result.remainingCredit}` : ''}`,
      });

      navigate("/fees");
    } catch (err: any) {
      console.error("DEBUG: Submit Error", err);
      toast({
        title: "Error",
        description: err.message || "Failed to collect fee",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <div className="flex items-center gap-3">
          <CreditCard className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Collect Fee</h1>
            <p className="text-muted-foreground">
              Record student payment
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fee Collection</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Search */}
              <div className="space-y-2">
                <Label>Search Student *</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search by student name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select
                  value={selectedStudentId}
                  onValueChange={handleStudentChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>

                  <SelectContent>
                    {/* 1. PERSISTED STUDENT: Always show if selected */}
                    {persistedStudent && (
                      <SelectItem key={persistedStudent.id} value={persistedStudent.id}>
                        {persistedStudent.name} – {persistedStudent.program} ({persistedStudent.batch})
                      </SelectItem>
                    )}

                    {/* 2. SEARCH RESULTS: Show search results (exclude persisted to avoid dupe) */}
                    {allStudents
                      .filter(s => s.id !== persistedStudent?.id)
                      .map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} – {student.program} ({student.batch})
                        </SelectItem>
                      ))}

                    {/* 3. EMPTY STATE: Only if NO results and NO selection */}
                    {allStudents.length === 0 && !persistedStudent && (
                      <SelectItem value="__no_students__" disabled>
                        No students found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedStudentData && (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">{selectedStudentData.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudentData.program} ({selectedStudentData.batch})
                      </p>
                    </div>
                    {studentDues && (
                      <div className="text-right space-y-1 text-sm">
                        <p>Monthly: ₹{studentDues.monthlyFee}</p>
                        <p className="font-bold text-orange-600">
                          Pending: ₹{studentDues.pendingAmount}
                        </p>
                      </div>
                    )}
                  </div>

                  {loadingDues && (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {studentDues?.feeDetails && studentDues.feeDetails.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentDues.feeDetails.map((fee: any) => (
                            <TableRow key={fee.id}>
                              <TableCell>{fee.period}</TableCell>
                              <TableCell>{fee.activity}</TableCell>
                              <TableCell className="font-medium">₹{fee.amount}</TableCell>
                              <TableCell>₹{fee.paid}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                                  fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                  {fee.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <Label>Payment Method *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/fees")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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

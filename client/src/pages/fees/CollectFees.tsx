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
import { Loader2, Search, CreditCard, IndianRupee, History, Receipt, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

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
      <div className="max-w-2xl mx-auto space-y-8 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="bg-white/50 p-4 sm:p-6 rounded-2xl border border-muted/50 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm group hover:scale-105 transition-transform">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">Collect Institutional Fee</h1>
              <p className="text-muted-foreground text-sm font-medium">Record and reconcile student financial transactions.</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-muted/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-muted/50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-heading">Financial Disbursement Form</CardTitle>
            <History className="h-5 w-5 text-muted-foreground opacity-50" />
          </CardHeader>

          <CardContent className="p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Student Search */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">FIND STUDENT IDENTITY *</Label>
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    className="pl-10 h-12 rounded-xl border-muted/50 focus:ring-primary/20 transition-all font-bold pr-4"
                    placeholder="Type name, ID or mobile number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select
                  value={selectedStudentId}
                  onValueChange={handleStudentChange}
                >
                  <SelectTrigger className="h-12 rounded-xl border-muted/50 bg-muted/20 font-bold focus:ring-primary/20 transition-all">
                    <SelectValue placeholder="Select from verified results" />
                  </SelectTrigger>

                  <SelectContent className="rounded-xl shadow-xl border-muted/50">
                    {/* 1. PERSISTED STUDENT: Always show if selected */}
                    {persistedStudent && (
                      <SelectItem key={persistedStudent.id} value={persistedStudent.id} className="font-bold py-3">
                        {persistedStudent.name} – {persistedStudent.program} ({persistedStudent.batch})
                      </SelectItem>
                    )}

                    {/* 2. SEARCH RESULTS: Show search results (exclude persisted to avoid dupe) */}
                    {allStudents
                      .filter(s => s.id !== persistedStudent?.id)
                      .map((student) => (
                        <SelectItem key={student.id} value={student.id} className="font-bold py-3">
                          {student.name} – {student.program} ({student.batch})
                        </SelectItem>
                      ))}

                    {/* 3. EMPTY STATE: Only if NO results and NO selection */}
                    {allStudents.length === 0 && !persistedStudent && (
                      <SelectItem value="__no_students__" disabled className="text-center py-8 opacity-50 font-black uppercase text-[10px] tracking-widest">
                        Zero identities found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedStudentData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 rounded-2xl border border-indigo-100/50 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-sm">
                    <div className="space-y-1 w-full sm:w-auto">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1.5">Selected Identity</p>
                      <p className="text-xl font-black font-heading text-gray-900 truncate leading-none mb-1">{selectedStudentData.name}</p>
                      <p className="text-xs font-bold text-muted-foreground truncate uppercase tracking-tight">
                        {selectedStudentData.program} • {selectedStudentData.batch}
                      </p>
                    </div>
                    {studentDues && (
                      <div className="text-left sm:text-right space-y-2 text-sm w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-indigo-100/50 sm:pl-6 sm:border-l">
                        <div className="flex sm:flex-col justify-between items-center sm:items-end">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base Subscription</p>
                          <p className="font-black text-gray-900">₹{studentDues.monthlyFee.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex sm:flex-col justify-between items-center sm:items-end">
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Aggregate Arrears</p>
                          <p className="font-black text-xl text-orange-600 font-heading tracking-tighter">
                            ₹{studentDues.pendingAmount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {loadingDues && (
                    <div className="flex justify-center p-8 bg-muted/10 rounded-2xl border border-dashed border-muted/50">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {studentDues?.feeDetails && studentDues.feeDetails.length > 0 && (
                    <div className="border border-muted/50 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Frequency</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Service Item</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Liability</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Reconciled</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Current Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentDues.feeDetails.map((fee: any) => (
                              <TableRow key={fee.id} className="hover:bg-muted/20 transition-colors uppercase font-bold text-[11px]">
                                <TableCell className="whitespace-nowrap">{fee.period}</TableCell>
                                <TableCell className="whitespace-nowrap font-black text-gray-900">{fee.activity}</TableCell>
                                <TableCell className="whitespace-nowrap">₹{fee.amount.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="whitespace-nowrap text-green-600">₹{fee.paid.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <span className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-inner",
                                    fee.status === 'paid' ? 'bg-green-100 text-green-700' :
                                      fee.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'
                                  )}>
                                    {fee.status}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">TRANSACTION VALUE *</Label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary">
                      <IndianRupee className="h-4 w-4" />
                    </div>
                    <Input
                      type="number"
                      className="pl-10 h-14 rounded-xl border-muted/50 focus:ring-primary/20 transition-all font-black text-lg bg-white"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">DISBURSEMENT MODE *</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="h-14 rounded-xl border-muted/50 focus:ring-primary/20 transition-all font-bold bg-white">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      <SelectItem value="cash" className="font-bold py-3"><div className="flex items-center gap-2">CASH SETTLEMENT</div></SelectItem>
                      <SelectItem value="card" className="font-bold py-3"><div className="flex items-center gap-2">CARD TERMINAL</div></SelectItem>
                      <SelectItem value="online" className="font-bold py-3"><div className="flex items-center gap-2">UPI / NET BANKING</div></SelectItem>
                      <SelectItem value="cheque" className="font-bold py-3"><div className="flex items-center gap-2">PAPER CHEQUE</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">ADMINISTRATIVE AUDIT NOTES</Label>
                <div className="relative group">
                  <Receipt className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground opacity-30 group-focus-within:opacity-100 transition-opacity" />
                  <Textarea
                    className="min-h-[100px] pl-10 rounded-2xl border-muted/50 focus:ring-primary/20 transition-all font-medium py-3"
                    placeholder="Specify transaction reference, remarks or specific instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-muted/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/fees")}
                  className="w-full sm:w-auto font-black uppercase text-xs tracking-widest h-14 px-10 rounded-xl border-muted/50 hover:bg-muted/10 transition-all"
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>RECONCILING...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>INITIALIZE LEDGER ENTRY</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

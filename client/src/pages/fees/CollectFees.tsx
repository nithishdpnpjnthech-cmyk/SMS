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
import { IndianRupee, Wallet, Search, Receipt, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

  // 🔍 SEARCH STUDENTS
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setAllStudents([]);
        return;
      }

      try {
        const res = await fetch(`/api/students/search?q=${encodeURIComponent(searchTerm.trim())}`, {
          headers: {
            "x-user-role": user?.role || "",
            "x-user-id": user?.id || "",
            "x-user-branch": user?.branchId || "",
          },
        });

        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();
        const results = Array.isArray(data) ? data : [];
        setAllStudents(results);
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleStudentChange = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setSearchTerm("");
    setAllStudents([]);

    if (studentId) {
      const student = allStudents.find((s) => s.id === studentId);
      if (student) setPersistedStudent(student);
      loadStudentDues(studentId);
    }
  };

  const loadStudentDues = async (studentId: string) => {
    setLoadingDues(true);
    try {
      const res = await api.getStudentDues(studentId);
      setStudentDues(res);
      // Auto-set the amount to the pending dues if it's 0 or empty
      if (res && res.totalPending > 0 && !amount) {
        setAmount(String(res.totalPending));
      }
    } catch (err) {
      console.error("Failed to load dues:", err);
    } finally {
      setLoadingDues(false);
    }
  };

  // 💾 Collect Fee
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId || !amount) {
      toast({
        title: "Error",
        description: "Please select a student and enter amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    if (paymentMethod === 'cash') {
      try {
        const payload = {
          studentId: selectedStudentId,
          amount: Number(amount),
          paymentMethod,
          notes,
        };

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

        // Reset form immediately
        setSelectedStudentId("");
        setPersistedStudent(null);
        setAmount("");
        setNotes("");
        setStudentDues(null);

        // Navigate after short delay
        setTimeout(() => navigate("/fees"), 500);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to collect fee",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // online payment
      try {
        const orderRes = await fetch("/api/fees/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Number(amount),
            studentId: selectedStudentId
          }),
        });

        const order = await orderRes.json();
        if (!orderRes.ok) throw new Error(order.error || "Failed to create payment order");

        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "HUURA ACADEMY",
          description: notes || "Fee Payment",
          order_id: order.id,
          handler: async (response: any) => {
            try {
              setIsLoading(true);
              const verifyRes = await fetch("/api/fees/verify-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...response,
                  studentId: selectedStudentId,
                  amount: Number(amount),
                  notes
                }),
              });

              const result = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(result.error || "Payment verification failed");

              toast({
                title: "Success",
                description: "Payment collected via UPI successfully",
              });
              
              // Reset form immediately
              setSelectedStudentId("");
              setPersistedStudent(null);
              setAmount("");
              setNotes("");
              setStudentDues(null);
              
              // Navigate after short delay
              setTimeout(() => navigate("/fees"), 500);
            } catch (err: any) {
              toast({
                title: "Verification Failed",
                description: err.message,
                variant: "destructive",
              });
            } finally {
              setIsLoading(false);
            }
          },
          prefill: {
            name: persistedStudent?.name || "",
            email: persistedStudent?.email || "",
            phone: persistedStudent?.phone || "",
          },
          theme: {
            color: "#f97316",
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err: any) {
        toast({
          title: "Payment Error",
          description: err.message || "Failed to initiate UPI payment",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Back Link */}
        <Link href="/fees">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-sm font-black uppercase tracking-widest">Back to Ledger</span>
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-4xl font-black font-heading tracking-tight text-gray-900 uppercase">Fee Collection</h1>
          <p className="text-muted-foreground font-medium text-sm">Disburse student fees and generate transaction receipts.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          <Card className="border-muted/50 shadow-2xl shadow-primary/5 rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-muted/50 p-8 sm:p-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black font-heading tracking-tight uppercase">Cashier Terminal</CardTitle>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Transaction Module</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8 sm:p-10 space-y-8">
              {/* Student Search */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">RECIPIENT IDENTIFICATION *</Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary">
                    <Search className="h-4 w-4" />
                  </div>
                  <Input
                    placeholder="Search by ID, Name or Phone..."
                    className="pl-10 h-14 rounded-xl border-muted/50 focus:ring-primary/20 transition-all font-bold bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {allStudents.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-muted/50 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto backdrop-blur-xl border-t-0 animate-in fade-in slide-in-from-top-2">
                      {allStudents.map((s) => (
                        <div
                          key={s.id}
                          className="p-4 hover:bg-primary/5 cursor-pointer border-b border-muted/30 last:border-0 transition-colors group/item"
                          onClick={() => handleStudentChange(s.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-black text-gray-900 group-hover/item:text-primary transition-colors uppercase italic">{s.name}</p>
                              <div className="flex gap-3 text-[10px] font-bold text-muted-foreground tracking-widest mt-1">
                                <span>ID: {String(s.id).slice(0, 8).toUpperCase()}</span>
                                <span>•</span>
                                <span>{s.phone}</span>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <ArrowLeft className="h-4 w-4 rotate-180" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Student Profile */}
              {persistedStudent && (
                <div className="bg-muted/30 rounded-3xl p-6 border border-muted/50 animate-in zoom-in-95 duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary border border-muted/50">
                        <span className="text-xl font-black font-heading uppercase">{persistedStudent.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-black font-heading tracking-tight uppercase leading-none mb-1">{persistedStudent.name}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                          <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-primary" /> {persistedStudent.program || 'GENERAL PROGRAM'}</span>
                          <span className="flex items-center gap-1.5">BATCH: {persistedStudent.batch || 'DEFAULT'}</span>
                        </div>
                      </div>
                    </div>
                    {studentDues && (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">AGGREGATE DUES</p>
                        <p className="text-2xl font-black text-orange-600 font-heading tabular-nums">₹{studentDues.totalPending.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Amount & Method */}
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
                  {/* Quick Select Buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setAmount("1500")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${amount === "1500" ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-muted/30 border-muted/50 text-muted-foreground hover:bg-muted/50"}`}
                    >
                      <Sparkles className="h-3 w-3" /> MONTHLY (₹1.5K)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmount("4000")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${amount === "4000" ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-muted/30 border-muted/50 text-muted-foreground hover:bg-muted/50"}`}
                    >
                      <Sparkles className="h-3 w-3" /> QUARTERLY (₹4K)
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">DISBURSEMENT MODE *</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="h-14 rounded-xl border-muted/50 focus:ring-primary/20 transition-all font-bold bg-white">
                      <div className="flex items-center gap-2 uppercase tracking-wide">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      <SelectItem value="cash" className="font-bold py-3 uppercase tracking-wide">CASH SETTLEMENT</SelectItem>
                      <SelectItem value="online" className="font-bold py-3 uppercase tracking-wide">UPI / NET BANKING</SelectItem>
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
                  disabled={isLoading}
                >
                  Terminate Process
                </Button>
                <Button
                  type="submit"
                  className="flex-1 font-black uppercase text-xs tracking-[0.2em] h-14 rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98] bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing Transaction...</span>
                    </div>
                  ) : (
                    <span>Authenticate & Authorize Disbursement</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, DollarSign, CreditCard, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function CollectFees() {
  const [, setLocation] = useLocation();
  const { students, addFee } = useAppStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const amount = parseFloat(formData.get("amount") as string);
    
    setTimeout(() => {
      if (selectedStudent) {
        addFee({
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          type: formData.get("feeType") as string,
          mode: formData.get("paymentMode") as string,
          status: "paid"
        });

        toast({
          title: "Payment Recorded",
          description: `Successfully collected $${amount} from ${selectedStudent.name}`,
          className: "bg-green-600 text-white border-none"
        });
      }

      setIsLoading(false);
      setLocation("/fees");
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="cursor-pointer hover:text-foreground" onClick={() => setLocation("/fees")}>Fees & Billing</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">New Transaction</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-heading">Collect Payment</h1>
          <p className="text-muted-foreground">Record a new fee payment from a student.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Select Student</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search student by name or ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStudent && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm animate-in fade-in">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Program:</span>
                      <span className="font-medium">{selectedStudent.program}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedStudent.feesStatus === 'paid' ? 'default' : 'destructive'} className="text-xs">
                        {selectedStudent.feesStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="feeType">Fee Type</Label>
                    <Select name="feeType" defaultValue="Tuition">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tuition">Monthly Tuition</SelectItem>
                        <SelectItem value="Registration">Registration Fee</SelectItem>
                        <SelectItem value="Uniform">Uniform/Kit</SelectItem>
                        <SelectItem value="Exam">Exam Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input name="amount" id="amount" className="pl-9" placeholder="0.00" defaultValue="150.00" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <Select name="paymentMode" defaultValue="Cash">
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Credit/Debit Card</SelectItem>
                      <SelectItem value="UPI">UPI / Online Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Remarks (Optional)</Label>
                  <Input id="notes" placeholder="e.g., Paid for May and June" />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setLocation("/fees")}>Cancel</Button>
                <Button type="submit" disabled={isLoading || !selectedStudent} className="bg-green-600 hover:bg-green-700">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Payment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { Badge } from "@/components/ui/badge";

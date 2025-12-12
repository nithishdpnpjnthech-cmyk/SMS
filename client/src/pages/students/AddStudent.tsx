import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, ChevronRight, CheckCircle, CreditCard } from "lucide-react";
import { PROGRAMS, BATCHES } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AddStudent() {
  const [, setLocation] = useLocation();
  const { addStudent } = useAppStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const fullName = `${firstName} ${lastName}`;
    
    // Simulate API call delay
    setTimeout(() => {
      addStudent({
        name: fullName,
        program: formData.get("program") as string,
        batch: formData.get("batch") as string,
        status: "active",
        joinDate: formData.get("joinDate") as string,
        parentName: formData.get("parentName") as string,
        phone: formData.get("phone") as string,
        feesStatus: "due",
        attendance: 0,
      });

      setIsLoading(false);
      setNewStudentName(fullName);
      // Predict the next ID (simplified logic matching store)
      // In a real app, the backend returns the ID
      setNewStudentId(`ST-XXX`); 
      setShowIdCard(true);

      toast({
        title: "Student Registered",
        description: `${fullName} has been successfully enrolled.`,
        className: "bg-green-600 text-white border-none"
      });
    }, 1000);
  };

  const handleClose = () => {
    setShowIdCard(false);
    setLocation("/students");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="cursor-pointer hover:text-foreground" onClick={() => setLocation("/students")}>Students</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">New Registration</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-heading">Register New Student</h1>
          <p className="text-muted-foreground">Enter the student's personal and academic details.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input name="firstName" id="firstName" placeholder="Alex" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input name="lastName" id="lastName" placeholder="Johnson" required />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input name="dob" id="dob" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender">
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Academic Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    <Select name="program" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch / Class Timing</Label>
                    <Select name="batch" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {BATCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Joining Date</Label>
                  <Input name="joinDate" id="joinDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              {/* Parent Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Guardian Contact</h3>
                <div className="space-y-2">
                  <Label htmlFor="parentName">Guardian Name</Label>
                  <Input name="parentName" id="parentName" placeholder="David Johnson" required />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input name="phone" id="phone" placeholder="+1 (555) 000-0000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input name="email" id="email" type="email" placeholder="parent@example.com" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/students")}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Registration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Generated ID Card Dialog */}
        <Dialog open={showIdCard} onOpenChange={setShowIdCard}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Registration Successful
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                Digital ID Card has been generated. <br/>Use this for attendance scanning.
              </p>
              
              {/* ID Card Mockup */}
              <div className="w-full max-w-sm bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <CreditCard className="h-24 w-24" />
                </div>
                <div className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 font-heading font-bold">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-primary">A</div>
                      AcademyMaster
                    </div>
                    <div className="text-xs opacity-80">STUDENT ID</div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg bg-white/20 border-2 border-white/30 flex items-center justify-center">
                      <span className="text-2xl font-bold">{newStudentName.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{newStudentName}</h3>
                      <p className="opacity-80 text-sm">Karate Program</p>
                      <p className="opacity-60 text-xs mt-1">Valid thru Dec 2025</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-end">
                    <div className="text-xs opacity-70">
                      123 Academy Street<br/>Cityville, State
                    </div>
                    {/* Fake QR Code */}
                    <div className="bg-white p-1 rounded">
                      <div className="h-12 w-12 bg-black/90 opacity-80 grid grid-cols-4 gap-0.5">
                         {Array.from({length: 16}).map((_, i) => (
                           <div key={i} className={`bg-white ${Math.random() > 0.5 ? 'opacity-0' : 'opacity-100'}`}></div>
                         ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <DialogFooter className="sm:justify-center">
              <Button type="button" className="w-full" onClick={handleClose}>
                Done & Go to List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

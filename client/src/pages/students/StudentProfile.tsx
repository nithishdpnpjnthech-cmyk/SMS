import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen, Clock, FileText, Download, Edit, IndianRupee, Trash2, GraduationCap } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import StudentCredentialsSection from "@/components/StudentCredentialsSection";

export default function StudentProfile() {
  const { toast } = useToast();
  const [, params] = useRoute("/students/:id");
  const studentId = params?.id;

  // Fix: Fetch student data directly instead of depending on store
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [fees, setFees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  // Fix: Load student data on component mount and when studentId changes
  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    if (!studentId) return;

    setIsLoading(true);
    try {
      const [studentData, feesData, attendanceData] = await Promise.all([
        api.getStudent(studentId),
        api.getFees(undefined, studentId).catch(() => []),
        api.getAttendance({ studentId }).catch(() => [])
      ]);

      setStudent(studentData);
      setFees(Array.isArray(feesData) ? feesData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (error) {
      console.error("Failed to load student data:", error);
      toast({
        title: "Error",
        description: "Failed to load student profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fix: Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading student profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Fix: Show "Student not found" if no data
  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold mb-2">Student Not Found</h2>
          <p className="text-muted-foreground mb-4">The student profile you're looking for doesn't exist.</p>
          <Link href="/students">
            <Button variant="outline">Return to Student List</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const studentFees = fees.filter(f => f.student_id === student.id || f.studentId === student.id || f.studentName === student.name);
  const studentAttendance = attendance.filter(a => a.student_id === student.id || a.studentId === student.id);
  const presentCount = studentAttendance.filter(a => a.status === 'present' || a.status === 'PRESENT').length;
  const attendanceRate = studentAttendance.length > 0 ? Math.round((presentCount / studentAttendance.length) * 100) : 0;

  const handleDeactivate = async () => {
    try {
      await api.deactivateStudent(student.id);
      toast({
        title: "Success",
        description: "Student deactivated successfully",
      });
      loadStudentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate student",
        variant: "destructive"
      });
    }
  };

  const handleSuspend = async () => {
    try {
      await api.suspendStudent(student.id);
      toast({
        title: "Success",
        description: "Student suspended successfully",
      });
      loadStudentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend student",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      await api.updateStudent(student.id, {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        parentPhone: formData.get("parentPhone") as string,
        guardianName: formData.get("guardianName") as string,
        address: formData.get("address") as string,
      });

      setIsEditOpen(false);
      toast({
        title: "Success",
        description: "Student profile updated successfully",
      });

      // Reload student data
      loadStudentData();
    } catch (error: any) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update student profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <Link href="/students">
          <Button variant="ghost" className="pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground h-8 sm:h-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="text-sm">Back to Student List</span>
          </Button>
        </Link>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <Card className="w-full lg:w-96 shrink-0 shadow-lg border-muted/50 overflow-hidden bg-white/50 backdrop-blur-sm group">
            <div className="h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-muted/30"></div>
            <CardContent className="pt-0 flex flex-col items-center text-center px-6 pb-8">
              <div className="-mt-12 mb-4">
                <Avatar className="h-32 w-32 border-8 border-white shadow-xl hover:scale-105 transition-transform duration-300">
                  <AvatarFallback className="text-4xl bg-primary text-white font-black font-heading">
                    {student.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-2xl font-black font-heading text-gray-900 tracking-tight leading-tight mb-1">{student.name}</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-3 py-1 bg-muted/50 rounded-full border border-muted/50 shadow-inner">REG ID: {student.id}</p>

              <div className="flex flex-wrap justify-center gap-2 mb-8">
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className={`font-bold px-3 py-1 shadow-sm border-none ${student.status === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
                  {student.status.toUpperCase()}
                </Badge>
                {student.uniform_issued && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-bold px-3 py-1 shadow-sm">
                    KITTED
                  </Badge>
                )}
              </div>

              <div className="w-full space-y-4 text-left bg-white/60 p-5 rounded-2xl border border-muted/50 shadow-inner">
                <div className="flex items-center gap-4 group/item">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-muted/50 text-muted-foreground group-hover/item:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="truncate text-sm font-bold text-gray-700">{student.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-4 group/item">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-muted/50 text-muted-foreground group-hover/item:text-primary transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{student.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-4 group/item">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-muted/50 text-muted-foreground group-hover/item:text-primary transition-colors">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 leading-tight">{student.address || 'No address provided'}</span>
                </div>
              </div>

              <div className="w-full mt-8 flex flex-wrap gap-2">
                <Button className="flex-1 shadow-md hover:shadow-lg transition-all font-bold h-11 rounded-xl" variant="default" onClick={() => setIsEditOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button className="flex-1 shadow-sm font-bold h-11 rounded-xl" variant="outline" onClick={handleDeactivate}>
                  Deactivate
                </Button>
                <Button className="w-full sm:w-auto px-4 shadow-sm font-bold h-11 rounded-xl text-red-600 border-red-100 hover:bg-red-50" variant="outline" onClick={handleSuspend}>
                  <Trash2 className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Suspend</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Details Tabs */}
          <div className="flex-1 w-full bg-white/40 backdrop-blur-sm rounded-3xl p-1 sm:p-2 border border-muted/50 shadow-sm">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-none rounded-2xl h-auto p-1 bg-muted/30 gap-1 overflow-x-auto flex-nowrap scrollbar-hide">
                <TabsTrigger
                  value="overview"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2.5 font-bold transition-all text-sm uppercase tracking-wider"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2.5 font-bold transition-all text-sm uppercase tracking-wider"
                >
                  Attendance History
                </TabsTrigger>
                <TabsTrigger
                  value="fees"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2.5 font-bold transition-all text-sm uppercase tracking-wider"
                >
                  Fees & Invoices
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-muted/50 overflow-hidden group">
                    <CardHeader className="bg-muted/10 border-b border-muted/30 py-4">
                      <CardTitle className="text-lg font-black font-heading flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        Academic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 pt-6 uppercase">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground tracking-widest leading-none">PROGRAM ENROLLED</p>
                        <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{student.program}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground tracking-widest leading-none">CURRENT BATCH</p>
                        <p className="font-bold text-gray-900">{student.batch}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground tracking-widest leading-none">ENROLLMENT DATE</p>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{student.joining_date ? new Date(student.joining_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'NOT RECORDED'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-muted/50 overflow-hidden group">
                    <CardHeader className="bg-muted/10 border-b border-muted/30 py-4">
                      <CardTitle className="text-lg font-black font-heading flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        Institutional Tracking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 pt-6 uppercase">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground tracking-widest leading-none">UNIFORM STATUS</p>
                        <Badge variant="outline" className={`font-black px-2 mt-1 border-none shadow-sm ${student.uniform_issued ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {student.uniform_issued ? 'KITTED & READY' : 'AWAITING GEAR'}
                        </Badge>
                      </div>
                      {student.uniform_issued && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground tracking-widest leading-none">SIZE RECORDED</p>
                          <p className="font-bold text-gray-900">{student.uniform_size || 'DEFAULT'}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground tracking-widest leading-none">GUARDIAN CONTACT</p>
                        <p className="font-bold text-gray-900">{student.parent_phone || 'NOT PROVIDED'}</p>
                        {student.guardian_name && <p className="text-[9px] font-black text-muted-foreground -mt-1">{student.guardian_name.toUpperCase()}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm border-muted/50 overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b border-muted/30 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-black font-heading flex items-center gap-2">
                      <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      Recent Admin Remarks
                    </CardTitle>
                    <Button variant="outline" size="sm" className="h-8 font-bold text-[10px] uppercase tracking-wider">Add Note</Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-center text-muted-foreground py-16 px-6 bg-gradient-to-b from-transparent to-muted/10">
                      <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner border border-muted/20 opacity-40">
                        <FileText className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest opacity-40">No remarks found for this profile</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Student Login Credentials Section */}
                <StudentCredentialsSection studentId={student.id} studentData={student} onUpdate={loadStudentData} />
              </TabsContent>

              <TabsContent value="attendance" className="mt-6">
                <Card className="shadow-lg border-muted/50 overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b border-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-primary shadow-sm">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="font-heading text-xl">Attendance Summary</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Complete tracking and statistics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <div className="grid md:grid-cols-2 gap-12 sm:gap-16">
                      <div className="flex flex-col items-center justify-center p-8 bg-blue-50/50 rounded-3xl border border-blue-100 shadow-inner group">
                        <p className="mb-2 text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] leading-none">OVERALL PRESENCE</p>
                        <div className="relative">
                          <span className="text-6xl font-black text-primary font-heading tracking-tighter transition-transform group-hover:scale-110 duration-500 block">{attendanceRate}%</span>
                        </div>
                        <p className="text-xs font-bold text-primary/80 mt-4 uppercase bg-white px-4 py-1.5 rounded-full border border-primary/10 shadow-sm">
                          {presentCount} OF {studentAttendance.length} SESSIONS RECORDED
                        </p>
                      </div>

                      <div className="space-y-4 py-4 uppercase">
                        <div className="flex justify-between items-center bg-muted/20 p-3 rounded-xl border border-muted/30 group hover:border-muted-foreground/30 transition-all">
                          <span className="text-[10px] font-black text-muted-foreground tracking-widest">Marked Present</span>
                          <span className="font-black text-green-600 font-heading text-lg">{presentCount}</span>
                        </div>
                        <div className="flex justify-between items-center bg-muted/20 p-3 rounded-xl border border-muted/30 group hover:border-muted-foreground/30 transition-all">
                          <span className="text-[10px] font-black text-muted-foreground tracking-widest">Marked Absent</span>
                          <span className="font-black text-red-600 font-heading text-lg">{studentAttendance.filter(a => a.status === 'absent' || a.status === 'ABSENT').length}</span>
                        </div>
                        <div className="flex justify-between items-center bg-muted/20 p-3 rounded-xl border border-muted/30 group hover:border-muted-foreground/30 transition-all">
                          <span className="text-[10px] font-black text-muted-foreground tracking-widest">Delayed / Late</span>
                          <span className="font-black text-orange-600 font-heading text-lg">{studentAttendance.filter(a => a.is_late || a.isLate).length}</span>
                        </div>
                        <div className="flex justify-between items-center bg-muted/20 p-3 rounded-xl border border-muted/30 group hover:border-muted-foreground/30 transition-all">
                          <span className="text-[10px] font-black text-muted-foreground tracking-widest">Total Engagements</span>
                          <span className="font-black text-gray-900 font-heading text-lg">{studentAttendance.length}</span>
                        </div>
                      </div>
                    </div>
                    {studentAttendance.length === 0 && (
                      <div className="text-center py-16 bg-muted/5 rounded-3xl mt-8 border border-dashed border-muted/30">
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-muted/20 opacity-30">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40">No academic engagement records found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fees" className="mt-6">
                <Card className="shadow-lg border-muted/50 overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b border-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shadow-sm">
                          <IndianRupee className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="font-heading text-xl">Payment Records</CardTitle>
                          <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Ledger of all financial transactions</CardDescription>
                        </div>
                      </div>
                      <Button size="sm" className="font-bold uppercase tracking-wider text-[10px] h-8 shadow-md">Create Invoice</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {studentFees.length > 0 ? (
                        studentFees.map(fee => (
                          <div key={fee.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-muted/50 p-4 rounded-2xl bg-white hover:bg-muted/5 transition-colors group">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                              <div className="h-12 w-12 bg-muted/30 rounded-xl flex items-center justify-center border border-muted/50 group-hover:scale-110 transition-transform">
                                <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-black text-gray-900 font-heading text-sm uppercase tracking-tight truncate">{fee.type || fee.notes || 'Institutional Fee'}</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recorded on {fee.date || new Date().toLocaleDateString('en-IN')}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-4 sm:mt-0 border-t sm:border-none pt-3 sm:pt-0">
                              <div className="text-right">
                                <p className="text-xl font-black text-gray-900 font-heading flex items-center tracking-tighter">
                                  <IndianRupee className="h-4 w-4 mr-0.5 text-muted-foreground/60" />
                                  {fee.amount.toLocaleString('en-IN')}
                                </p>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 text-[9px] font-black px-2 -mt-1 leading-none">VERIFIED PAID</Badge>
                              </div>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted/50">
                                <Download className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        ))) : (
                        <div className="text-center py-16 bg-muted/5 rounded-3xl border border-dashed border-muted/30">
                          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-muted/20 opacity-30">
                            <IndianRupee className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40">No confirmed financial records exist</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={student.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={student.email || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" defaultValue={student.phone || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
                <Input id="parentPhone" name="parentPhone" defaultValue={student.parent_phone || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianName">Guardian Name</Label>
                <Input id="guardianName" name="guardianName" defaultValue={student.guardian_name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={student.address || ''} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

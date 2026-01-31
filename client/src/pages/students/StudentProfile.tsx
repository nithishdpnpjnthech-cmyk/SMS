import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen, Clock, FileText, Download, Edit } from "lucide-react";
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
      <div className="space-y-6">
        <Link href="/students">
          <Button variant="ghost" className="pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Student List
          </Button>
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Card className="w-full md:w-80 shrink-0">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-32 w-32 border-4 border-muted mb-4">
                <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                  {student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold font-heading">{student.name}</h2>
              <p className="text-sm text-muted-foreground mb-2">ID: {student.id}</p>
              <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="mb-6">
                {student.status.toUpperCase()}
              </Badge>

              <div className="w-full space-y-4 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{student.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{student.address || 'No address provided'}</span>
                </div>
              </div>
              
              <div className="w-full mt-6 flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => setIsEditOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button className="flex-1" variant="outline" onClick={handleDeactivate}>
                  Deactivate
                </Button>
                <Button className="px-3" variant="destructive" onClick={handleSuspend}>
                  Suspend
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Details Tabs */}
          <div className="flex-1 w-full">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="attendance" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
                >
                  Attendance History
                </TabsTrigger>
                <TabsTrigger 
                  value="fees" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
                >
                  Fees & Invoices
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Program Enrolled</p>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{student.program}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Current Batch</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{student.batch}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{student.joining_date ? new Date(student.joining_date).toLocaleDateString() : 'Not available'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Parent/Guardian Phone</p>
                      <span className="font-semibold">{student.parent_phone || 'Not provided'}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Guardian Name</p>
                      <span className="font-semibold">{student.guardian_name || 'Not provided'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Uniform Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Uniform Issued</p>
                      <Badge variant={student.uniform_issued ? 'default' : 'secondary'}>
                        {student.uniform_issued ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                    {student.uniform_issued && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Uniform Size</p>
                        <span className="font-semibold">{student.uniform_size || 'Not specified'}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                      No notes available
                    </p>
                  </CardContent>
                </Card>

                {/* Student Login Credentials Section */}
                <StudentCredentialsSection studentId={student.id} studentData={student} onUpdate={loadStudentData} />
              </TabsContent>

              <TabsContent value="attendance" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                    <CardDescription>Student attendance records and statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="text-center py-8">
                        <p className="mb-4 text-muted-foreground">Recorded Attendance Rate</p>
                        <span className="text-4xl font-bold text-foreground">{attendanceRate}%</span>
                        <p className="text-sm mt-2">{presentCount} classes present out of {studentAttendance.length} total</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Classes:</span>
                          <span className="font-bold">{studentAttendance.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Present:</span>
                          <span className="font-bold text-green-600">{presentCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Absent:</span>
                          <span className="font-bold text-red-600">{studentAttendance.filter(a => a.status === 'absent' || a.status === 'ABSENT').length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Late:</span>
                          <span className="font-bold text-orange-600">{studentAttendance.filter(a => a.is_late).length}</span>
                        </div>
                      </div>
                    </div>
                    {studentAttendance.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No attendance records found for this student.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fees" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Payment History</CardTitle>
                      <Button size="sm">Create Invoice</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentFees.length > 0 ? (
                        studentFees.map(fee => (
                        <div key={fee.id} className="flex items-center justify-between border p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{fee.type}</p>
                              <p className="text-xs text-muted-foreground">Paid on {fee.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold">${fee.amount.toFixed(2)}</span>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))) : (
                        <p className="text-center text-muted-foreground py-4">No payments recorded yet.</p>
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

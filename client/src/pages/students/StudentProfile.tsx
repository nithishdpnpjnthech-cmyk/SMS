import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen, Clock, FileText, Download, Edit, IndianRupee, Trash2, GraduationCap, Plus, Loader2, CreditCard } from "lucide-react";
import { Link, useParams, useRoute } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import StudentCredentialsSection from "@/components/StudentCredentialsSection";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAcademyBranding } from "@/hooks/use-academy-branding";

export default function StudentProfile({ params: propParams }: any) {
  const { toast } = useToast();
  const hookParams = useParams();
  const studentId = propParams?.id || hookParams?.id;

  // Fix: Fetch student data directly instead of depending on store
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [fees, setFees] = useState<any[]>([]);
  const [monthlyFees, setMonthlyFees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const { branding } = useAcademyBranding();
  const [showIdCard, setShowIdCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Defensive calculations for attendance stats
  const { presentCount, attendanceRate, absentCount, lateCount } = useMemo(() => {
    // Filter attendance for the selected month visualization
    const monthFiltered = attendance.filter((a: any) => {
      const d = new Date(a.date);
      return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
    });

    if (!Array.isArray(monthFiltered) || monthFiltered.length === 0) {
      return { presentCount: 0, attendanceRate: 0, absentCount: 0, lateCount: 0 };
    }
    const pCount = monthFiltered.filter((a: any) => (a?.status || '').toLowerCase() === 'present').length;
    const aCount = monthFiltered.filter((a: any) => (a?.status || '').toLowerCase() === 'absent').length;
    const lCount = monthFiltered.filter((a: any) => a?.is_late || a?.isLate).length;
    const rate = Math.round((pCount / monthFiltered.length) * 100);
    return { presentCount: pCount, attendanceRate: rate, absentCount: aCount, lateCount: lCount };
  }, [attendance, selectedMonth]);

  // Map attendance to dates for calendar
  const attendanceMap = useMemo(() => {
    const map: Record<string, any> = {};
    attendance.forEach(a => {
      const dateKey = format(new Date(a.date), 'yyyy-MM-dd');
      map[dateKey] = a;
    });
    return map;
  }, [attendance]);

  // Fix: Improved student ID extraction from window location as a fail-safe
  const getSafeStudentId = () => {
    if (studentId) return studentId;
    // Fallback: extract from URL path /students/:id
    const pathParts = window.location.pathname.split('/');
    const idFromPath = pathParts[pathParts.indexOf('students') + 1];
    return idFromPath && idFromPath.length > 20 ? idFromPath : null;
  };

  const activeStudentId = getSafeStudentId();

  // Fix: Load student data on component mount and when id changes
  useEffect(() => {
    if (activeStudentId) {
      loadStudentData(activeStudentId);
    } else {
      setIsLoading(false);
    }
  }, [activeStudentId]);

  const loadStudentData = async (id: string) => {
    setIsLoading(true);
    try {
      const [studentData, feesData, monthlyFeesData, attendanceData, remarksData] = await Promise.all([
        api.getStudent(id),
        api.getFees(undefined, id).catch(() => []),
        api.getStudentMonthlyFees(id).catch(() => []),
        api.getStudentAttendanceHistory(id).catch(() => []),
        api.getStudentRemarks(id).catch(() => [])
      ]);

      setStudent(studentData);
      setFees(Array.isArray(feesData) ? feesData : []);
      setMonthlyFees(Array.isArray(monthlyFeesData) ? monthlyFeesData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      setRemarks(Array.isArray(remarksData) ? remarksData : []);
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
            <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs animate-pulse">Establishing Secure Connection...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Fix: Show "Student not found" ONLY if we tried to load and got nothing
  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 text-center max-w-md shadow-sm">
            <h2 className="text-2xl font-black font-heading text-orange-600 mb-2 mt-4 uppercase tracking-tight">Profile Not Found</h2>
            <p className="text-muted-foreground mb-8 text-sm font-medium">The student details could not be retrieved. This happens if the link is broken or the record was removed.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/students">
                <Button variant="default" className="font-bold rounded-xl shadow-lg">Back to List</Button>
              </Link>
              <Button variant="outline" className="font-bold rounded-xl" onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Ensure we have arrays for rendering
  const studentFees = Array.isArray(fees) ? fees : [];
  const studentAttendance = Array.isArray(attendance) ? attendance : [];

  const safeFormat = (date: any, formatStr: string = 'dd/MM/yyyy') => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, formatStr);
    } catch (e) {
      return 'N/A';
    }
  };

  const safeCurrency = (amount: any) => {
    try {
      const num = Number(amount);
      if (isNaN(num)) return '0';
      return num.toLocaleString('en-IN');
    } catch (e) {
      return '0';
    }
  };

  const safeText = (text: any, fallback: string = '-') => {
    if (text === null || text === undefined) return fallback;
    return String(text);
  };

  const downloadIndividualAttendance = () => {
    if (studentAttendance.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance records found to download.",
        variant: "destructive"
      });
      return;
    }

    const academyName = branding?.academyName || "Academy Management System";
    const headers = ["Session Date", "Status", "Check-In", "Check-Out", "Late", "Notes"];
    const rows = studentAttendance.map((a: any) => {
      let formattedDate = "N/A";
      try {
        if (a.date) {
          const d = new Date(a.date);
          if (!isNaN(d.getTime())) {
            formattedDate = format(d, 'dd/MM/yyyy');
          }
        }
      } catch (e) {
        console.error("Date formatting error:", e);
      }
      return [
        formattedDate,
        (a.status || "N/A").toUpperCase(),
        a.check_in || "N/A",
        a.check_out || "N/A",
        a.is_late || a.isLate ? "YES" : "NO",
        a.notes || ""
      ];
    });

    const csvContent = [
      [academyName.toUpperCase()],
      [`ATTENDANCE REPORT: ${(student?.name || "STUDENT").toUpperCase()}`],
      [`GENERATED ON: ${safeFormat(new Date(), 'dd/MM/yyyy HH:mm')}`],
      [],
      headers,
      ...rows
    ].map(row => row.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${student.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Attendance report downloaded successfully"
    });
  };

  const handleDeactivate = async () => {
    try {
      await api.deactivateStudent(student.id);
      toast({
        title: "Success",
        description: "Student deactivated successfully",
      });
      loadStudentData(student.id);
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
      loadStudentData(student.id);
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
      loadStudentData(student.id);
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

  const handleAddRemark = async () => {
    if (!newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      await api.addStudentRemark(student.id, newNote);
      toast({
        title: "Success",
        description: "Administrative remark added successfully",
      });
      setNewNote("");
      setIsNoteOpen(false);
      // Fetch fresh remarks
      const remarksData = await api.getStudentRemarks(student.id);
      setRemarks(remarksData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add remark",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDownloadIdCard = async () => {
    if (!cardRef.current) return;

    // Use a small timeout to ensure everything is rendered
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(cardRef.current!, {
          scale: 2,
          backgroundColor: "#f97316",
          useCORS: true,
          logging: false,
          width: cardRef.current!.offsetWidth,
          height: cardRef.current!.offsetHeight
        });

        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `id-card-${student?.name?.replace(/\s+/g, '-').toLowerCase() || 'student'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Download failed:', error);
        toast({
          title: "Download Failed",
          description: "Could not generate PNG. Please try again.",
          variant: "destructive"
        });
      }
    }, 100);
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
                    {(student?.name || 'S').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-2xl font-black font-heading text-gray-900 tracking-tight leading-tight mb-1 capitalize">{student.name}</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-3 py-1 bg-muted/50 rounded-full border border-muted/50 shadow-inner">REG ID: {String(student.id || "").toUpperCase()}</p>

              <div className="flex flex-wrap justify-center gap-2 mb-8">
                <Badge variant={(student.status || 'active') === 'active' ? 'default' : 'secondary'} className={`font-bold px-3 py-1 shadow-sm border-none ${(student.status || 'active') === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
                  {(student.status || 'ACTIVE').toUpperCase()}
                </Badge>
                {student.uniform_issued && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-bold px-3 py-1 shadow-sm">
                    KITTED
                  </Badge>
                )}
              </div>

              <div className="w-full space-y-4 text-left bg-white/60 p-5 rounded-2xl border border-muted/50 shadow-inner">
                <div className="flex items-center gap-4 group/item">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-muted/50 text-muted-foreground group-hover/item:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="truncate text-sm font-bold text-gray-700">{safeText(student.email, 'No email provided')}</span>
                </div>
                <div className="flex items-center gap-4 group/item">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-muted/50 text-muted-foreground group-hover/item:text-primary transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{safeText(student.phone, 'No phone provided')}</span>
                </div>
                <div className="flex items-center gap-4 group/item">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-muted/50 text-muted-foreground group-hover/item:text-primary transition-colors">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 leading-tight">{safeText(student.address, 'No address provided')}</span>
                </div>
              </div>

              <div className="w-full mt-8 grid grid-cols-2 gap-2">
                <Button className="shadow-md hover:shadow-lg transition-all font-bold h-11 rounded-xl" variant="default" onClick={() => setIsEditOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button className="shadow-sm font-bold h-11 rounded-xl" variant="outline" onClick={() => setShowIdCard(true)}>
                  <CreditCard className="mr-2 h-4 w-4" /> ID Card
                </Button>
                <Button className="shadow-sm font-bold h-11 rounded-xl" variant="outline" onClick={handleDeactivate}>
                  Deactivate
                </Button>
                <Button
                  className="shadow-sm font-bold h-11 rounded-xl text-red-600 border-red-100 hover:bg-red-50 group/suspend"
                  variant="outline"
                  onClick={handleSuspend}
                  disabled={student.status === 'suspended'}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-500 group-hover/suspend:scale-110 transition-transform" />
                  {student.status === 'suspended' ? 'Suspended' : 'Suspend'}
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
                <TabsTrigger
                  value="credentials"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 py-2.5 font-bold transition-all text-sm uppercase tracking-wider"
                >
                  Credentials
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
                        <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{safeText(student.program)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground tracking-widest leading-none">CURRENT BATCH</p>
                        <p className="font-bold text-gray-900">{safeText(student.batch)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground tracking-widest leading-none">ENROLLMENT DATE</p>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{safeFormat(student.joining_date, 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-muted/50 overflow-hidden group">
                    <CardHeader className="bg-muted/10 border-b border-muted/30 py-4">
                      <CardTitle className="text-lg font-black font-heading flex items-center gap-2">
                        <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600">
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
                        <p className="font-bold text-gray-900">{safeText(student.parent_phone, 'NOT PROVIDED')}</p>
                        {student.guardian_name && <p className="text-[9px] font-black text-muted-foreground -mt-1">{(student.guardian_name || '').toUpperCase()}</p>}
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 font-bold text-[10px] uppercase tracking-wider"
                      onClick={() => setIsNoteOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Note
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {remarks.length > 0 ? (
                      <div className="divide-y divide-muted/30 max-h-80 overflow-y-auto">
                        {remarks.map((remark) => (
                          <div key={remark.id} className="p-4 bg-white/50 hover:bg-white/80 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{remark.author_name || 'Admin'}</p>
                              <p className="text-[10px] font-bold text-muted-foreground">{safeFormat(remark.created_at, 'dd MMM yyyy, hh:mm a')}</p>
                            </div>
                            <p className="text-sm text-gray-700 font-medium leading-relaxed">{remark.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-16 px-6 bg-gradient-to-b from-transparent to-muted/10">
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner border border-muted/20 opacity-40">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest opacity-40">No remarks found for this profile</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="credentials" className="mt-6">
                <StudentCredentialsSection studentId={student.id} studentData={student} onUpdate={() => activeStudentId && loadStudentData(activeStudentId)} />
              </TabsContent>

              <TabsContent value="attendance" className="mt-6">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {/* Left Column: Calendar */}
                  <Card className="xl:col-span-8 shadow-lg border-muted/50 overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-muted/30 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-primary shadow-sm">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="font-heading text-xl">Attendance Calendar</CardTitle>
                          <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                            {format(selectedMonth, 'MMMM yyyy')} Tracking
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-bold h-8 rounded-xl"
                          onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-bold h-8 rounded-xl"
                          onClick={() => setSelectedMonth(new Date())}
                        >
                          Today
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-bold h-8 rounded-xl"
                          onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}
                        >
                          Next
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex justify-center">
                        <div className="w-full max-w-2xl bg-white p-4 rounded-3xl border border-muted/50 shadow-inner">
                          {/* Calendar Visualization */}
                          <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="text-center text-[10px] font-black text-muted-foreground uppercase py-2">{day}</div>
                            ))}
                            {(() => {
                              const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
                              const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();

                              const items = [];
                              // Empty slots for days before the 1st
                              for (let i = 0; i < firstDayOfMonth; i++) {
                                items.push(<div key={`empty-${i}`} className="h-16 sm:h-20 bg-muted/5 rounded-2xl border border-dashed border-muted/20" />);
                              }

                              // Days of the month
                              for (let d = 1; d <= daysInMonth; d++) {
                                const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), d);
                                const dateStr = format(date, 'yyyy-MM-dd');
                                const record = attendanceMap[dateStr];

                                items.push(
                                  <div
                                    key={d}
                                    className={cn(
                                      "h-16 sm:h-20 rounded-2xl border p-2 flex flex-col justify-between transition-all group hover:shadow-md",
                                      record ? (
                                        record.status.toLowerCase() === 'present' ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                                      ) : "bg-white border-muted/30"
                                    )}
                                  >
                                    <span className="text-xs font-black text-gray-500">{d}</span>
                                    {record && (
                                      <div className="space-y-1">
                                        <Badge className={cn(
                                          "text-[8px] px-1 py-0 h-4 border-none flex items-center justify-center font-black",
                                          record.status.toLowerCase() === 'present' ? "bg-green-500" : "bg-red-500"
                                        )}>
                                          {record.status.charAt(0).toUpperCase()}
                                        </Badge>
                                        <div className="text-[8px] font-bold text-gray-900 truncate flex flex-col">
                                          <span>{record.check_in || '--:--'}</span>
                                          {(record.is_late || record.isLate) && <span className="text-orange-600">LATE</span>}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return items;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-wrap gap-4 justify-center">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Absent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-white border border-muted/50" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No Record</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Right Column: Mini Stats */}
                  <div className="xl:col-span-4 space-y-6">
                    <Card className="shadow-lg border-muted/50 overflow-hidden bg-gradient-to-br from-white to-orange-50/30">
                      <CardHeader className="py-4 border-b border-muted/30">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-orange-900">Monthly Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-muted/50 text-center shadow-sm">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Attendance Rate</p>
                          <p className="text-4xl font-black text-primary font-heading tracking-tighter">{attendanceRate}%</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-white rounded-2xl border border-muted/50 text-center shadow-sm">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Present</p>
                            <p className="text-xl font-black text-green-600 font-heading">{presentCount}</p>
                          </div>
                          <div className="p-3 bg-white rounded-2xl border border-muted/50 text-center shadow-sm">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Absent</p>
                            <p className="text-xl font-black text-red-600 font-heading">{absentCount}</p>
                          </div>
                          <div className="p-3 bg-white rounded-2xl border border-muted/50 text-center shadow-sm">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Late</p>
                            <p className="text-xl font-black text-orange-600 font-heading">{lateCount}</p>
                          </div>
                          <div className="p-3 bg-white rounded-2xl border border-muted/50 text-center shadow-sm">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total</p>
                            <p className="text-xl font-black text-gray-900 font-heading">{presentCount + absentCount}</p>
                          </div>
                        </div>

                        <Button
                          className="w-full rounded-xl font-bold uppercase tracking-wider text-xs h-12 shadow-md"
                          onClick={downloadIndividualAttendance}
                        >
                          <Download className="h-4 w-4 mr-2" /> Download Report
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Recent Feed */}
                    <Card className="shadow-lg border-muted/50 overflow-hidden">
                      <CardHeader className="py-4 border-b border-muted/30">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-muted/20">
                          {attendance.slice(0, 5).map((a, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between">
                              <div>
                                <p className="text-[11px] font-bold text-gray-900">{format(new Date(a.date), 'dd MMM yyyy')}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black">{a.status}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-gray-700">{a.check_in || '--:--'}</p>
                                {a.trainer_name && <p className="text-[9px] text-muted-foreground italic">by {a.trainer_name}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fees" className="mt-6">
                <Card className="shadow-lg border-muted/50 overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b border-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg text-orange-600 shadow-sm">
                          <IndianRupee className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="font-heading text-xl">Financial Records</CardTitle>
                          <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Monthly Subscription Status</CardDescription>
                        </div>
                      </div>
                      <Button size="sm" className="font-bold uppercase tracking-wider text-[10px] h-8 shadow-md rounded-xl">Generate Invoice</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-8">
                    {/* Monthly Subscription View */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Subscription History</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {monthlyFees.length > 0 ? (
                          monthlyFees.map((mf, idx) => (
                            <Card key={idx} className="border-muted/50 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                              <div className={cn(
                                "h-2 w-full",
                                mf.status === 'paid' ? "bg-green-500" : "bg-orange-500"
                              )} />
                              <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                      {new Date(mf.year, mf.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </p>
                                    <h4 className="text-lg font-black text-gray-900 font-heading tracking-tight">Fee Amount: ₹{Number(mf.amount).toLocaleString('en-IN')}</h4>
                                  </div>
                                  <Badge className={cn(
                                    "text-[9px] font-black px-2 shadow-sm border-none uppercase",
                                    mf.status === 'paid' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                  )}>
                                    {mf.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                  <div className="text-[10px] font-bold text-muted-foreground">
                                    {Number(mf.paid_amount) > 0 ? `Paid: ₹${Number(mf.paid_amount).toLocaleString('en-IN')}` : 'Awaiting Payment'}
                                  </div>
                                  <div className="text-[10px] font-bold text-muted-foreground">
                                    Due: {mf.due_date ? format(new Date(mf.due_date), 'dd MMM yyyy') : 'N/A'}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-10 bg-muted/5 rounded-3xl border border-dashed border-muted/30">
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40">No monthly fee records generated yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator className="my-8" />

                    {/* All Transactions List */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Recent Transactions</p>
                      <div className="space-y-3">
                        {studentFees.length > 0 ? (
                          studentFees.map(fee => (
                            <div key={fee.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-muted/50 p-4 rounded-2xl bg-white hover:bg-muted/5 transition-colors group">
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="h-10 w-10 bg-muted/30 rounded-xl flex items-center justify-center border border-muted/50 group-hover:scale-110 transition-transform">
                                  <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-black text-gray-900 font-heading text-sm uppercase tracking-tight truncate">{fee.type || fee.notes || 'Institutional Fee'}</p>
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recorded on {fee.paid_date ? format(new Date(fee.paid_date), 'dd MMM yyyy') : format(new Date(fee.created_at), 'dd MMM yyyy')}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-4 sm:mt-0 border-t sm:border-none pt-3 sm:pt-0">
                                <div className="text-right">
                                  <p className="text-lg font-black text-gray-900 font-heading flex items-center tracking-tighter">
                                    <IndianRupee className="h-4 w-4 mr-0.5 text-muted-foreground/60" />
                                    {safeCurrency(fee.amount)}
                                  </p>
                                  <Badge variant="outline" className={cn(
                                    "text-[9px] font-black px-2 shadow-sm border-none uppercase leading-none mt-1",
                                    fee.status === 'paid' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                  )}>
                                    {fee.status}
                                  </Badge>
                                </div>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted/50">
                                  <Download className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          ))) : (
                          <div className="text-center py-10 bg-muted/5 rounded-3xl border border-dashed border-muted/30">
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40">No confirmed financial records exist</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="font-heading font-black text-xl flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600">
                  <FileText className="h-4 w-4" />
                </div>
                ADD ADMINISTRATIVE NOTE
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="note" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Remark Details</Label>
                <Textarea
                  id="note"
                  placeholder="Specify academic concerns, behavior notes, or administrative reminders..."
                  className="min-h-[120px] bg-muted/20 border-muted/50 focus:bg-white transition-all text-sm font-medium"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="font-bold rounded-xl"
                onClick={() => setIsNoteOpen(false)}
                disabled={isSubmittingNote}
              >
                Cancel
              </Button>
              <Button
                className="font-bold rounded-xl bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200"
                onClick={handleAddRemark}
                disabled={isSubmittingNote}
              >
                {isSubmittingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Remarks
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {/* ID Card Modal */}
        <Dialog open={showIdCard} onOpenChange={setShowIdCard}>
          <DialogContent className="max-w-md bg-white border-0 shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-3 text-xl font-black font-heading tracking-tight text-gray-900">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                  <CreditCard className="h-6 w-6" />
                </div>
                Student ID Card
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* ID Card Preview */}
              <div
                ref={cardRef}
                data-card="id-card"
                className="relative w-full aspect-[1.6/1] bg-[#f97316] text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between"
                style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
              >
                {/* Decorative Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

                {/* Card Header */}
                <div className="relative z-10 p-6 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h3 className="font-black text-sm tracking-[0.2em] uppercase opacity-90">STUDENT IDENTITY</h3>
                    <div className="h-0.5 w-8 bg-white/50 rounded-full"></div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md">ACADEMY PASS</span>
                  </div>
                </div>

                {/* Card Center Body */}
                <div className="relative z-10 px-6 flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 bg-white rounded-2xl p-3 shadow-xl flex items-center justify-center">
                      <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                      <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h4 className="text-2xl font-black font-heading tracking-tight truncate leading-none mb-1 uppercase">{student.name}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70">ID: {String(student.id || "").slice(0, 8)}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[8px] font-black uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded leading-none">
                        {student.program || 'GENERAL'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Details */}
                <div className="relative z-10 bg-black/20 backdrop-blur-md p-4 flex justify-between items-center border-t border-white/10">
                  <div className="flex gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/50">BATCH</p>
                      <p className="text-[10px] font-bold">{student.batch || 'DEFAULT'}</p>
                    </div>
                    <div className="space-y-0.5 border-l border-white/10 pl-4">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/50">JOINED</p>
                      <p className="text-[10px] font-bold">{safeFormat(student.joining_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black tracking-tighter opacity-80 uppercase">HUURA ACADEMY</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => setShowIdCard(false)}
                  className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black uppercase text-xs tracking-widest rounded-xl transition-all"
                >
                  Close
                </Button>
                <Button
                  onClick={handleDownloadIdCard}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

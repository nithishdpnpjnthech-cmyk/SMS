import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function MarkAttendance() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    if (!hasPermission('attendance.write')) {
      setLocation('/dashboard');
      return;
    }
    // Clear any existing attendance data to start fresh
    setAttendanceData({});
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

  const filteredStudents = students.filter(student => {
    const matchesProgram = selectedProgram === "all" || student.program === selectedProgram;
    const matchesBatch = selectedBatch === "all" || student.batch === selectedBatch;
    return matchesProgram && matchesBatch;
  });

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get only students that were actually marked (have a status set)
    const markedStudents = Object.entries(attendanceData).filter(([studentId, status]) => {
      return status && status.trim() !== '' && status !== 'undefined';
    });

    console.log("All attendance data:", attendanceData);
    console.log("Filtered marked students:", markedStudents);

    if (markedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please mark at least one student",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Creating attendance for ${markedStudents.length} marked students only`);

      // Create records ONLY for explicitly marked students
      const attendanceRecords = markedStudents.map(([studentId, status]) => {
        const student = filteredStudents.find(s => s.id === studentId);
        const record = {
          studentId: studentId,
          date: date,
          status: status,
          checkIn: (status === 'present' || status === 'late') ? new Date().toISOString() : null,
          checkOut: null,
          notes: `Marked by ${user?.name || user?.username}`
        };
        console.log(`Creating record for ${student?.name}:`, record);
        return record;
      });

      console.log("Final attendance records to send:", attendanceRecords);
      const response = await api.createBulkAttendance(attendanceRecords);
      console.log("Backend response:", response);

      toast({
        title: "Success!",
        description: `Attendance marked for ${markedStudents.length} students`
      });

      setLocation('/attendance');
    } catch (error: any) {
      console.error("Failed to mark attendance:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAllPresent = () => {
    const newAttendanceData: Record<string, string> = {};
    filteredStudents.forEach(student => {
      newAttendanceData[student.id] = 'present';
    });
    setAttendanceData(newAttendanceData);
  };

  const markAllAbsent = () => {
    const newAttendanceData: Record<string, string> = {};
    filteredStudents.forEach(student => {
      newAttendanceData[student.id] = 'absent';
    });
    setAttendanceData(newAttendanceData);
  };

  const programs = Array.from(new Set(students.map(s => s.program).filter(Boolean)));
  const batches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="bg-white/50 p-4 sm:p-6 rounded-2xl border border-muted/50 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary shadow-sm group hover:scale-105 transition-transform">
              <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">Mark Attendance</h1>
              <p className="text-muted-foreground text-sm font-medium">Record and verify daily student academic engagement.</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-muted/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-muted/50">
            <CardTitle className="text-lg font-heading">Attendance Log Form</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-muted/20 p-5 rounded-2xl border border-muted/50 shadow-inner">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">LOG DATE</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="h-11 rounded-xl border-muted/50 focus:ring-primary/20 transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">FILTER PROGRAM</Label>
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger className="h-11 rounded-xl border-muted/50 focus:ring-primary/20 transition-all font-bold">
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-bold">All Programs</SelectItem>
                      {programs.map(program => (
                        <SelectItem key={program} value={program} className="font-bold">{program}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">FILTER BATCH</Label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger className="h-11 rounded-xl border-muted/50 focus:ring-primary/20 transition-all font-bold">
                      <SelectValue placeholder="All Batches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-bold">All Batches</SelectItem>
                      {batches.map(batch => (
                        <SelectItem key={batch} value={batch} className="font-bold">{batch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={markAllPresent} className="w-full sm:w-auto font-black text-xs uppercase tracking-widest h-11 px-6 rounded-xl border-muted/50 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all shadow-sm">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark All Present
                </Button>
                <Button type="button" variant="outline" onClick={markAllAbsent} className="w-full sm:w-auto font-black text-xs uppercase tracking-widest h-11 px-6 rounded-xl border-muted/50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all shadow-sm">
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark All Absent
                </Button>
              </div>

              {/* Student List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-muted/50 pb-2">
                  <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                    Active Listings ({filteredStudents.length})
                  </h3>
                </div>
                {filteredStudents.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-5 bg-white border border-muted/50 rounded-2xl shadow-sm hover:shadow-md transition-all group gap-5">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black font-heading transition-transform group-hover:scale-110">
                            {student.name?.charAt(0) || 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-gray-900 font-heading tracking-tight leading-none mb-1 group-hover:text-primary transition-colors underline-offset-4 group-hover:underline">{student.name}</p>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                              {student.program} • {student.batch}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-11 lg:h-10 lg:px-5 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-sm",
                              attendanceData[student.id] === 'present'
                                ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                                : 'border-muted/50 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                            )}
                            onClick={() => handleAttendanceChange(student.id, 'present')}
                          >
                            <CheckCircle className="mr-0 lg:mr-2 h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Present</span>
                            <span className="sm:hidden">Pres</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-11 lg:h-10 lg:px-5 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-sm",
                              attendanceData[student.id] === 'late'
                                ? 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700'
                                : 'border-muted/50 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200'
                            )}
                            onClick={() => handleAttendanceChange(student.id, 'late')}
                          >
                            <Clock className="mr-0 lg:mr-2 h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Delayed</span>
                            <span className="sm:hidden">Late</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-11 lg:h-10 lg:px-5 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-sm",
                              attendanceData[student.id] === 'absent'
                                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                                : 'border-muted/50 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                            )}
                            onClick={() => handleAttendanceChange(student.id, 'absent')}
                          >
                            <XCircle className="mr-0 lg:mr-2 h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Absent</span>
                            <span className="sm:hidden">Abs</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-muted/10 rounded-3xl border border-dashed border-muted/50">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm opacity-40">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40">
                      No matching student identities found
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-muted/50">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto font-black uppercase text-xs tracking-widest h-12 px-8 rounded-xl border-muted/50 hover:bg-muted/10 transition-all"
                  onClick={() => setLocation("/attendance")}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:flex-1 h-12 bg-primary text-primary-foreground font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>PROCESSING...</span>
                    </div>
                  ) : (
                    "Confirm & Save Attendance"
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
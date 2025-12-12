import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PROGRAMS, BATCHES } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AttendanceDashboard() {
  const { students, markAttendance, attendance } = useAppStore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedProgram, setSelectedProgram] = useState(PROGRAMS[0]);
  const [selectedBatch, setSelectedBatch] = useState(BATCHES[0]);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    return students.filter(s => s.program === selectedProgram && s.batch === selectedBatch);
  }, [students, selectedProgram, selectedBatch]);

  // Get current attendance status for selected date/batch
  const getStatus = (studentId: string) => {
    if (!date) return undefined;
    const dateStr = format(date, "yyyy-MM-dd");
    const record = attendance.find(r => 
      r.studentId === studentId && 
      r.date === dateStr &&
      r.batch === selectedBatch
    );
    return record?.status;
  };

  const handleMark = (studentId: string, status: "present" | "absent" | "late") => {
    if (!date) return;
    markAttendance({
      id: "", // generated in store
      date: format(date, "yyyy-MM-dd"),
      program: selectedProgram,
      batch: selectedBatch,
      studentId,
      status
    });
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Attendance Saved",
        description: `Records updated for ${format(date!, "MMM dd, yyyy")}`,
        className: "bg-green-600 text-white border-none"
      });
    }, 800);
  };

  // Stats calculation
  const stats = useMemo(() => {
    if (!date) return { present: 0, absent: 0, late: 0, total: 0 };
    const dateStr = format(date, "yyyy-MM-dd");
    const todayRecords = attendance.filter(r => r.date === dateStr);
    
    // This is a global stat for the day, not just the filtered view, to make the sidebar summary useful
    const present = todayRecords.filter(r => r.status === 'present').length;
    const absent = todayRecords.filter(r => r.status === 'absent').length;
    const late = todayRecords.filter(r => r.status === 'late').length;
    
    return { present, absent, late, total: todayRecords.length };
  }, [attendance, date]);

  const presentPercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Attendance</h1>
            <p className="text-muted-foreground">Track and manage daily class attendance.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Calendar Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow-sm w-full"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Summary for {date ? format(date, "MMM dd") : "Today"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Present</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{presentPercentage}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Count</span>
                  <span className="text-sm font-medium">{stats.present} / {stats.total}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Attendance Area */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Class Attendance</CardTitle>
                    <CardDescription>Mark attendance for specific batches.</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Program" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                      <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {BATCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const status = getStatus(student.id);
                      return (
                        <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-muted/40 border border-transparent hover:border-border transition-all gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{student.name}</p>
                              <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Button 
                              size="sm" 
                              variant={status === 'present' ? 'default' : 'outline'}
                              className={status === 'present' ? 'bg-green-600 hover:bg-green-700 flex-1 sm:flex-none' : 'text-muted-foreground flex-1 sm:flex-none'}
                              onClick={() => handleMark(student.id, 'present')}
                            >
                              <Check className="h-4 w-4 mr-1" /> Present
                            </Button>
                            <Button 
                              size="sm" 
                              variant={status === 'absent' ? 'destructive' : 'outline'}
                              className={status === 'absent' ? 'flex-1 sm:flex-none' : 'text-muted-foreground flex-1 sm:flex-none'}
                              onClick={() => handleMark(student.id, 'absent')}
                            >
                              <X className="h-4 w-4 mr-1" /> Absent
                            </Button>
                            <Button 
                              size="sm" 
                              variant={status === 'late' ? 'secondary' : 'outline'}
                              className={status === 'late' ? 'bg-orange-100 text-orange-800 flex-1 sm:flex-none' : 'text-muted-foreground flex-1 sm:flex-none'}
                              onClick={() => handleMark(student.id, 'late')}
                            >
                              <Clock className="h-4 w-4 mr-1" /> Late
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No students found in this batch.
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                  <Button variant="outline">Reset</Button>
                  <Button onClick={handleSaveAll} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

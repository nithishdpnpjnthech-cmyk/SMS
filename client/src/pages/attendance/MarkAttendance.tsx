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
    if (filteredStudents.length === 0) {
      toast({
        title: "Error",
        description: "No students to mark attendance for",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Preparing attendance records for date:", date);
      console.log("Filtered students:", filteredStudents.length);
      console.log("Attendance data:", attendanceData);
      
      // Prepare attendance records - ONLY attendance table fields
      const attendanceRecords = filteredStudents.map(student => {
        const status = attendanceData[student.id] || 'absent';
        const record = {
          studentId: student.id,
          date: date, // Send as YYYY-MM-DD string
          status: status,
          checkIn: (status === 'present' || status === 'late') ? new Date().toISOString() : null,
          checkOut: null,
          notes: `Marked by ${user?.name || user?.username}`
          // REMOVED: batch - not stored in attendance table
          // batch/program info comes from students table via JOIN
        };
        console.log(`Record for ${student.name}:`, record);
        return record;
      });

      console.log("Sending bulk attendance request:", { attendanceRecords });
      const response = await api.createBulkAttendance(attendanceRecords);
      console.log("Bulk attendance response:", response);
      
      toast({
        title: "Success!",
        description: `Attendance marked for ${filteredStudents.length} students`
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

  const programs = [...new Set(students.map(s => s.program).filter(Boolean))];
  const batches = [...new Set(students.map(s => s.batch).filter(Boolean))];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Mark Attendance</h1>
            <p className="text-muted-foreground">Record student attendance for today</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Attendance Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Program</Label>
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programs.map(program => (
                        <SelectItem key={program} value={program}>{program}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Batch</Label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Batches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {batches.map(batch => (
                        <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={markAllPresent}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark All Present
                </Button>
                <Button type="button" variant="outline" onClick={markAllAbsent}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark All Absent
                </Button>
              </div>

              {/* Student List */}
              <div className="space-y-4">
                <h3 className="font-semibold">Students ({filteredStudents.length})</h3>
                {filteredStudents.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {student.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.program} - {student.batch}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={attendanceData[student.id] === 'present' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleAttendanceChange(student.id, 'present')}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Present
                          </Button>
                          <Button
                            type="button"
                            variant={attendanceData[student.id] === 'late' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleAttendanceChange(student.id, 'late')}
                          >
                            <Clock className="mr-1 h-4 w-4" />
                            Late
                          </Button>
                          <Button
                            type="button"
                            variant={attendanceData[student.id] === 'absent' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleAttendanceChange(student.id, 'absent')}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Absent
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No students found. Adjust filters or add students first.
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/attendance")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || filteredStudents.length === 0}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Attendance
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
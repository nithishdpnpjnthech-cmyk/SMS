import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  program: string;
  batch: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: string;
  is_late: boolean;
  student_name: string;
}

export default function Attendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
    loadAttendance();
  }, [selectedDate, user]);

  const loadStudents = async () => {
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (error) {
      console.error("Failed to load students:", error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    }
  };

  const loadAttendance = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAttendance({ date: selectedDate });
      setAttendance(data);
    } catch (error) {
      console.error("Failed to load attendance:", error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: string) => {
    try {
      await api.markAttendance({
        studentId,
        date: selectedDate,
        status: status.toUpperCase(),
        isLate: status === 'late',
      });

      await loadAttendance();

      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
    } catch (error) {
      console.error("Failed to mark attendance:", error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    const record = attendance.find(a => a.student_id === studentId);
    if (!record) return null;

    if (record.status === 'PRESENT' && record.is_late) return 'late';
    return record.status.toLowerCase();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-700">Present</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-700">Late</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700">Absent</Badge>;
      default:
        return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Mark and manage student attendance</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Calendar className="h-4 w-4 text-primary" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm sm:text-base w-full sm:w-auto"
            />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 px-1 sm:px-0">
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Present Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {attendance.filter(a => a.status === 'PRESENT' || a.status === 'present').length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium">Absent Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {attendance.filter(a => a.status === 'ABSENT' || a.status === 'absent').length}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 shadow-sm">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-600">Not Marked</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {attendance.filter(a => a.status === 'NOT_MARKED' || a.status === 'not_marked').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mx-1 sm:mx-0 shadow-sm border-muted/50">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Student Attendance</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-3">
              {students.map((student) => {
                const status = getAttendanceStatus(student.id);
                return (
                  <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {student.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{student.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {student.program} - {student.batch}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="self-start sm:self-center">
                        {getStatusBadge(status)}
                      </div>

                      <div className="grid grid-cols-3 sm:flex gap-1.5 w-full sm:w-auto">
                        <Button
                          size="sm"
                          className="w-full sm:px-3 text-xs"
                          variant={status === 'present' ? 'default' : 'outline'}
                          onClick={() => markAttendance(student.id, 'present')}
                        >
                          Pres
                        </Button>
                        <Button
                          size="sm"
                          className="w-full sm:px-3 text-xs"
                          variant={status === 'late' ? 'default' : 'outline'}
                          onClick={() => markAttendance(student.id, 'late')}
                        >
                          Late
                        </Button>
                        <Button
                          size="sm"
                          className="w-full sm:px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          variant={status === 'absent' ? 'destructive' : 'outline'}
                          onClick={() => markAttendance(student.id, 'absent')}
                        >
                          Abs
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
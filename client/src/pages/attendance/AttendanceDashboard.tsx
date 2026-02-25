import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, Users, Clock, TrendingUp, Search, Plus, Edit2, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
























































































































































  id: string;
  student_id: string;
  student_name: string;
  program: string;
  batch: string;
  status: string;
  check_in?: string;
  check_out?: string;
  date: string;
  is_late?: boolean;
  hasRecord?: boolean;
}

interface Student {
  id: string;
  name: string;
  program: string;
  batch: string;
}

export default function AttendanceDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { hasPermission, user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    notMarked: 0,
    attendanceRate: 0,
    totalStudents: 0
  });

  const getStudentProgram = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return student?.program || '';
  };

  const getStudentBatch = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return student?.batch || '';
  };

  const handleEditAttendance = (record: AttendanceRecord) => {
    setEditingRecord(record);
  };

  const handleCheckOut = async (record: AttendanceRecord) => {
    try {
      const now = new Date();

      const updates = {
        checkOut: now.toISOString()  // Use camelCase to match backend expectation
      };

      console.log('Checking out with datetime:', now.toISOString());

      await api.updateAttendance(record.id, updates);
      await loadAttendanceData();

      toast({
        title: "Success",
        description: `Check-out recorded at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
      });
    } catch (error: any) {
      console.error('Check-out error:', error);
      toast({
        title: "Error",
        description: "Failed to record check-out",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAttendance = async (newStatus: string) => {
    if (!editingRecord) return;

    setIsUpdating(true);
    try {
      // Map frontend status to backend format
      let backendStatus, isLate;

      if (newStatus === 'present') {
        backendStatus = 'PRESENT';
        isLate = false;
      } else if (newStatus === 'late') {
        backendStatus = 'PRESENT';
        isLate = true;
      } else if (newStatus === 'absent') {
        backendStatus = 'ABSENT';
        isLate = false;
      }

      const updates = {
        status: backendStatus,
        isLate: isLate,
        checkIn: backendStatus === 'PRESENT' ? new Date().toISOString() : null,
        checkOut: null
      };

      await api.updateAttendance(editingRecord.id, updates);

      setEditingRecord(null);
      await loadAttendanceData();
      toast({
        title: "Success",
        description: "Attendance updated successfully"
      });
    } catch (error: any) {
      console.error('Failed to update attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      let attendanceData: any[] = [];
      let studentsData: Student[] = [];

      if (user?.role === "admin") {
        const branchId = new URLSearchParams(window.location.search).get("branchId");
        [attendanceData, studentsData] = await Promise.all([
          // pass date explicitly as query param
          api.getAttendance({ date: today }),
          api.getStudents(branchId ? { branchId } : undefined)
        ]);
      } else {
        [attendanceData, studentsData] = await Promise.all([
          api.getAttendance({ date: today }),
          api.getStudents()
        ]);
      }

      // Create a complete list showing all students with their attendance status
      const allStudentsWithStatus: AttendanceRecord[] = studentsData.map((student: Student) => {
        const attendanceRecord = attendanceData.find((record: any) => record.student_id === student.id);

        if (attendanceRecord) {
          // Student has an attendance record
          return {
            ...attendanceRecord,
            student_name: student.name,
            program: student.program,
            batch: student.batch
          };
        } else {
          // Student has no attendance record - show as NOT_MARKED
          return {
            id: `not-marked-${student.id}`,
            student_id: student.id,
            student_name: student.name,
            program: student.program,
            batch: student.batch,
            status: 'NOT_MARKED',
            check_in: null,
            check_out: null,
            date: today,
            hasRecord: false
          };
        }
      });

      setAttendance(allStudentsWithStatus);
      setStudents(studentsData);

      // Calculate correct stats from the complete list (allStudentsWithStatus)
      const totalPresent = allStudentsWithStatus.filter(a =>
        a.status === 'PRESENT' || a.status === 'present'
      ).length;
      const totalLate = allStudentsWithStatus.filter(a => Boolean(a.is_late)).length;
      const totalAbsent = allStudentsWithStatus.filter(a =>
        a.status === 'ABSENT' || a.status === 'absent'
      ).length;
      const notMarked = allStudentsWithStatus.filter(a =>
        a.status === 'NOT_MARKED'
      ).length;
      const totalStudents = allStudentsWithStatus.length;
      const markedStudents = totalPresent + totalAbsent;
      const attendanceRate = markedStudents > 0 ? Math.round((totalPresent / markedStudents) * 100) : 0;

      setStats({
        totalPresent,
        totalLate,
        totalAbsent,
        notMarked,
        attendanceRate,
        totalStudents
      });

      console.log("Dashboard stats:", {
        totalPresent,
        totalLate,
        totalAbsent,
        notMarked,
        totalStudents,
        markedStudents
      });
    } catch (error) {
      console.error("Failed to load attendance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      const studentName = record.student_name || '';
      const recordProgram = record.program || getStudentProgram(record.student_id);
      const recordBatch = record.batch || getStudentBatch(record.student_id);
      const recordStatus = record.status || '';

      const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProgram = selectedProgram === "all" ||
        recordProgram.toLowerCase() === selectedProgram.toLowerCase();
      const matchesBatch = selectedBatch === "all" ||
        recordBatch.toLowerCase() === selectedBatch.toLowerCase();
      const matchesStatus = statusFilter === "all" || recordStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesProgram && matchesBatch && matchesStatus;
    });
  }, [attendance, students, searchTerm, selectedProgram, selectedBatch, statusFilter]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading attendance data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Attendance</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Track and manage student attendance records.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {hasPermission('attendance.write') && (
              <>
                <Link href="/attendance/mark" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto gap-2 shadow-sm">
                    <Plus className="h-4 w-4" />
                    Mark Attendance
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto shadow-sm"
                  onClick={async () => {
                    if (confirm('Clear all attendance for today? This will reset all records.')) {
                      try {
                        await api.delete('/attendance/clear-today');
                        await loadAttendanceData();
                        toast({ title: "Success", description: "Today's attendance cleared" });
                      } catch (error) {
                        toast({ title: "Error", description: "Failed to clear attendance", variant: "destructive" });
                      }
                    }
                  }}
                >
                  Clear Today
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <CalendarCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalPresent}</div>
              <p className="text-xs text-muted-foreground">Students checked in</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Today</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.totalLate}</div>
              <p className="text-xs text-muted-foreground">Students late</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalAbsent}</div>
              <p className="text-xs text-muted-foreground">Students absent</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Not Marked</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.notMarked || 0}</div>
              <p className="text-xs text-muted-foreground">Not yet marked</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">Of marked students</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mx-1 sm:mx-0 shadow-sm border-muted/50">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Today's Attendance</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Student attendance records for {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-[150px]">
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger>
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="karate">Karate</SelectItem>
                    <SelectItem value="Yoga">Yoga</SelectItem>
                    <SelectItem value="Bharatnatyam">Bharatnatyam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[150px]">
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="weekends">Weekends</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[150px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="not_marked">Not Marked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4">Student Name</TableHead>
                      <TableHead className="px-4">Program</TableHead>
                      <TableHead className="px-4">Batch</TableHead>
                      <TableHead className="px-4">Check In</TableHead>
                      <TableHead className="px-4">Check Out</TableHead>
                      <TableHead className="px-4">Status</TableHead>
                      <TableHead className="text-right px-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.length > 0 ? (
                      filteredAttendance.map((record) => (
                        <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium px-4">{record.student_name || 'N/A'}</TableCell>
                          <TableCell className="px-4">{record.program || getStudentProgram(record.student_id) || 'N/A'}</TableCell>
                          <TableCell className="px-4">{record.batch || getStudentBatch(record.student_id) || 'N/A'}</TableCell>
                          <TableCell className="px-4">{record.check_in ? (
                            (() => {
                              try {
                                const checkInValue = record.check_in;
                                if (!checkInValue || checkInValue === 'N/A') return 'N/A';

                                let dateTime;
                                if (checkInValue.includes('T') || checkInValue.includes(' ')) {
                                  dateTime = new Date(checkInValue);
                                } else {
                                  const today = new Date().toISOString().split('T')[0];
                                  dateTime = new Date(`${today}T${checkInValue}`);
                                }

                                if (isNaN(dateTime.getTime())) return 'N/A';

                                return dateTime.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                });
                              } catch {
                                return 'N/A';
                              }
                            })()
                          ) : 'N/A'}</TableCell>
                          <TableCell className="px-4">{record.check_out ? (
                            (() => {
                              try {
                                const checkOutValue = record.check_out;
                                if (!checkOutValue || checkOutValue === 'N/A') return 'N/A';

                                let dateTime;
                                if (checkOutValue.includes('T') || checkOutValue.includes(' ')) {
                                  dateTime = new Date(checkOutValue);
                                } else {
                                  const today = new Date().toISOString().split('T')[0];
                                  dateTime = new Date(`${today}T${checkOutValue}`);
                                }

                                if (isNaN(dateTime.getTime())) return 'N/A';

                                return dateTime.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                });
                              } catch {
                                return 'N/A';
                              }
                            })()
                          ) : 'N/A'}</TableCell>
                          <TableCell className="px-4">
                            <Badge
                              variant={
                                record.status === 'PRESENT' || record.status === 'present' ?
                                  (record.is_late ? 'secondary' : 'default') :
                                  record.status === 'NOT_MARKED' ? 'secondary' :
                                    'destructive'
                              }
                              className={
                                record.status === 'PRESENT' || record.status === 'present' ?
                                  (record.is_late ? 'bg-orange-100 text-orange-700 hover:bg-orange-100 shadow-none' : 'bg-green-100 text-green-700 hover:bg-green-100 shadow-none') :
                                  record.status === 'NOT_MARKED' ? 'bg-gray-100 text-gray-700 hover:bg-gray-100 shadow-none' :
                                    'bg-red-100 text-red-700 hover:bg-red-100 shadow-none'
                              }
                            >
                              {record.status === 'PRESENT' || record.status === 'present' ?
                                (record.is_late ? 'Late' : 'Present') :
                                record.status === 'ABSENT' ? 'Absent' :
                                  record.status === 'NOT_MARKED' ? 'Not Marked' :
                                    record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-4">
                            <div className="flex gap-2 justify-end">
                              {record.check_in && !record.check_out && (record.status === 'PRESENT' || record.status === 'present') ? (
                                <Button size="sm" variant="outline" onClick={() => handleCheckOut(record)} className="h-8 shadow-sm">
                                  Check Out
                                </Button>
                              ) : null}
                              <Button size="sm" variant="outline" onClick={() => handleEditAttendance(record)} className="h-8 shadow-sm">
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          {attendance.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground mb-4">No attendance records for today.</p>
                              <Link href="/attendance/mark">
                                <Button className="shadow-sm">
                                  <Plus className="mr-2 h-4 w-4" />
                                  Start Taking Attendance
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            "No attendance records match your search criteria."
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Attendance</DialogTitle>
              <DialogDescription>
                Update attendance status for {editingRecord?.student_name || 'Student'}
              </DialogDescription>
            </DialogHeader>
            {editingRecord && (
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Current Status: <span className="font-semibold capitalize">{editingRecord.status}</span></Label>
                </div>
                <div className="grid gap-2">
                  <Label>Select New Status:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={editingRecord.status === 'PRESENT' && !editingRecord.is_late ? 'default' : 'outline'}
                      onClick={() => handleUpdateAttendance('present')}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      Present
                    </Button>
                    <Button
                      variant={editingRecord.status === 'PRESENT' && editingRecord.is_late ? 'secondary' : 'outline'}
                      onClick={() => handleUpdateAttendance('late')}
                      disabled={isUpdating}
                      className="flex-1 bg-orange-100 text-orange-700 hover:bg-orange-200"
                    >
                      Late
                    </Button>
                    <Button
                      variant={editingRecord.status === 'ABSENT' ? 'destructive' : 'outline'}
                      onClick={() => handleUpdateAttendance('absent')}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      Absent
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRecord(null)} disabled={isUpdating}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
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
    totalAbsent: 0,
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
      // Map frontend status to backend status
      const backendStatus = newStatus === 'present' ? 'PRESENT' : 
                           newStatus === 'absent' ? 'ABSENT' : 
                           newStatus.toUpperCase();
      
      const updates = {
        status: backendStatus,
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
      
      let attendanceData, studentsData;
      
      if (user?.role === "admin") {
        const branchId = new URLSearchParams(window.location.search).get("branchId");
        [attendanceData, studentsData] = await Promise.all([
          api.getAttendance(undefined, today),
          api.getStudents(branchId || undefined)
        ]);
      } else {
        [attendanceData, studentsData] = await Promise.all([
          api.getAttendance(undefined, today),
          api.getStudents()
        ]);
      }
      
      setAttendance(attendanceData);
      setStudents(studentsData);
      
      const totalPresent = attendanceData.filter(a => a.status === 'PRESENT' || a.status === 'present').length;
      const totalAbsent = attendanceData.filter(a => a.status === 'ABSENT' || a.status === 'absent').length;
      const totalRecords = attendanceData.length;
      const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

      setStats({
        totalPresent,
        totalAbsent,
        attendanceRate,
        totalStudents: totalRecords
      });

      console.log("Attendance data loaded:", attendanceData);
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Attendance</h1>
            <p className="text-muted-foreground">Track and manage student attendance records.</p>
          </div>
          <div className="flex items-center gap-2">
            {hasPermission('attendance.write') && (
              <Link href="/attendance/mark">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Mark Attendance
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
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
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">Today's rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>Student attendance records for {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.student_name || 'N/A'}</TableCell>
                        <TableCell>{record.program || getStudentProgram(record.student_id) || 'N/A'}</TableCell>
                        <TableCell>{record.batch || getStudentBatch(record.student_id) || 'N/A'}</TableCell>
                        <TableCell>{record.check_in ? (
                          (() => {
                            try {
                              const checkInValue = record.check_in;
                              if (!checkInValue || checkInValue === 'N/A') return 'N/A';
                              
                              // Handle full datetime or time-only formats
                              let dateTime;
                              if (checkInValue.includes('T') || checkInValue.includes(' ')) {
                                // Full datetime format
                                dateTime = new Date(checkInValue);
                              } else {
                                // Time-only format - combine with today's date
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
                        <TableCell>{record.check_out ? (
                          (() => {
                            try {
                              const checkOutValue = record.check_out;
                              if (!checkOutValue || checkOutValue === 'N/A') return 'N/A';
                              
                              // Handle full datetime or time-only formats
                              let dateTime;
                              if (checkOutValue.includes('T') || checkOutValue.includes(' ')) {
                                // Full datetime format
                                dateTime = new Date(checkOutValue);
                              } else {
                                // Time-only format - combine with today's date
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
                        <TableCell>
                          <Badge 
                            variant={record.status === 'PRESENT' || record.status === 'present' ? 'default' : 'destructive'}
                            className={
                              record.status === 'PRESENT' || record.status === 'present' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                              record.status === 'late' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                              'bg-red-100 text-red-700 hover:bg-red-100'
                            }
                          >
                            {record.status === 'PRESENT' ? 'Present' : 
                             record.status === 'ABSENT' ? 'Absent' : 
                             record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {record.check_in && !record.check_out && (record.status === 'PRESENT' || record.status === 'present') ? (
                              <Button size="sm" variant="outline" onClick={() => handleCheckOut(record)}>
                                Check Out
                              </Button>
                            ) : null}
                            <Button size="sm" variant="outline" onClick={() => handleEditAttendance(record)}>
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
                              <Button>
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
                      variant={editingRecord.status === 'PRESENT' || editingRecord.status === 'present' ? 'default' : 'outline'}
                      onClick={() => handleUpdateAttendance('present')}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      Present
                    </Button>
                    <Button
                      variant={editingRecord.status === 'ABSENT' || editingRecord.status === 'absent' ? 'destructive' : 'outline'}
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
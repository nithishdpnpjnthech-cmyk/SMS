import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, Users, Clock, TrendingUp, Search, Plus, Edit2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AttendanceDashboard() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    attendanceRate: 0,
    totalStudents: 0
  });

  const handleEditAttendance = (record: any) => {
    setEditingRecord(record);
  };

  const handleUpdateAttendance = async (newStatus: string) => {
    if (!editingRecord) return;
    
    setIsUpdating(true);
    try {
      const updates = {
        status: newStatus,
        checkIn: newStatus === 'present' || newStatus === 'late' ? new Date() : null,
        checkOut: null
      };
      
      await api.updateAttendance(editingRecord.id, updates);
      
      // Update local state
      setAttendance(prev => prev.map(record => 
        record.id === editingRecord.id 
          ? { ...record, ...updates }
          : record
      ));
      
      // Recalculate stats
      const updatedAttendance = attendance.map(record => 
        record.id === editingRecord.id 
          ? { ...record, ...updates }
          : record
      );
      
      const totalPresent = updatedAttendance.filter(a => a.status === 'present').length;
      const totalAbsent = updatedAttendance.filter(a => a.status === 'absent').length;
      const totalRecords = updatedAttendance.length;
      const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

      setStats({
        totalPresent,
        totalAbsent,
        attendanceRate,
        totalStudents: students.length
      });
      
      setEditingRecord(null);
      await loadAttendanceData(); // Refresh data to ensure consistency
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
      const [attendanceData, studentsData] = await Promise.all([
        api.getAttendance(undefined, today),
        api.getStudents()
      ]);
      
      setAttendance(attendanceData);
      setStudents(studentsData);
      
      // Calculate attendance stats
      const totalPresent = attendanceData.filter(a => a.status === 'present').length;
      const totalAbsent = attendanceData.filter(a => a.status === 'absent').length;
      const totalRecords = attendanceData.length;
      const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

      setStats({
        totalPresent,
        totalAbsent,
        attendanceRate,
        totalStudents: studentsData.length
      });

      console.log("Attendance data loaded:", { attendance: attendanceData, students: studentsData, stats });
    } catch (error) {
      console.error("Failed to load attendance data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Inactive Student';
  };

  const getStudentProgram = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.program || 'N/A';
  };

  const filteredAttendance = attendance.filter(record => {
    // Only show attendance records for active students
    const student = students.find(s => s.id === record.student_id);
    if (!student) return false; // Skip records for inactive/deleted students
    
    const studentName = student.name;
    const studentProgram = student.program;
    
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = programFilter === "all" || studentProgram === programFilter;
    const matchesBatch = batchFilter === "all" || record.batch === batchFilter;
    
    return matchesSearch && matchesProgram && matchesBatch;
  });

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

        {/* Stats Cards */}
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

        {/* Attendance Table */}
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
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="Karate">Karate</SelectItem>
                    <SelectItem value="Yoga">Yoga</SelectItem>
                    <SelectItem value="Bharatnatyam">Bharatnatyam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[150px]">
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    <SelectItem value="Morning Batch">Morning</SelectItem>
                    <SelectItem value="Evening Batch">Evening</SelectItem>
                    <SelectItem value="Weekend Batch">Weekend</SelectItem>
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
                        <TableCell className="font-medium">{getStudentName(record.student_id)}</TableCell>
                        <TableCell>{getStudentProgram(record.student_id)}</TableCell>
                        <TableCell>{record.batch || 'N/A'}</TableCell>
                        <TableCell>{record.check_in ? new Date(record.check_in).toLocaleTimeString() : 'N/A'}</TableCell>
                        <TableCell>{record.check_out ? new Date(record.check_out).toLocaleTimeString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.status === 'present' ? 'default' : record.status === 'late' ? 'secondary' : 'destructive'}
                            className={
                              record.status === 'present' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                              record.status === 'late' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                              'bg-red-100 text-red-700 hover:bg-red-100'
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleEditAttendance(record)}>
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
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

        {/* Edit Attendance Modal */}
        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Attendance</DialogTitle>
              <DialogDescription>
                Update attendance status for {editingRecord && getStudentName(editingRecord.student_id)}
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
                      variant={editingRecord.status === 'present' ? 'default' : 'outline'}
                      onClick={() => handleUpdateAttendance('present')}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      Present
                    </Button>
                    <Button
                      variant={editingRecord.status === 'late' ? 'default' : 'outline'}
                      onClick={() => handleUpdateAttendance('late')}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      Late
                    </Button>
                    <Button
                      variant={editingRecord.status === 'absent' ? 'destructive' : 'outline'}
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
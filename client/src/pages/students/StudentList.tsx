import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Plus, MoreHorizontal, Eye, Edit, UserX, UserCheck, UserMinus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  program?: string;
  batch?: string;
  status?: string;
  branch_name?: string;
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const branchId = new URLSearchParams(window.location.search).get("branchId");

  useEffect(() => {
    setIsLoading(true);
    setStudents([]);
    loadStudents();
    loadPrograms();
  }, [branchId, statusFilter, user]);

  const loadPrograms = async () => {
    try {
      const programsData = await api.getPrograms();
      setPrograms(programsData || []);
    } catch (error) {
      console.error("Failed to load programs:", error);
      setPrograms([]);
    }
  };

  const loadStudents = async () => {
    try {
      console.log("Loading students with status:", statusFilter);
      console.log("User role:", user?.role);
      console.log("Branch ID from URL:", branchId);

      const params: Record<string, string> = {};

      if (statusFilter && statusFilter !== 'active') {
        params.status = statusFilter;
      }

      if (user?.role === 'admin' && branchId) {
        params.branchId = branchId;
      }

      console.log("API params:", params);

      const data = await api.getStudents(params);
      console.log("Raw API response:", data);

      const studentsArray: Student[] = Array.isArray(data) ? data : [];
      console.log("Processed students array:", studentsArray);

      setStudents(studentsArray);
      console.log("Students loaded:", studentsArray.length, "students");
    } catch (error) {
      console.error("Failed to load students:", error);
      setStudents([]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (studentId: string, action: 'deactivate' | 'activate' | 'suspend', studentName: string) => {
    setActionLoading(studentId);
    try {
      let message;

      switch (action) {
        case 'deactivate':
          await api.deactivateStudent(studentId);
          message = `${studentName} has been deactivated`;
          break;
        case 'activate':
          await api.activateStudent(studentId);
          message = `${studentName} has been activated`;
          break;
        case 'suspend':
          await api.suspendStudent(studentId);
          message = `${studentName} has been suspended`;
          break;
      }

      await loadStudents();

      toast({
        title: "Success",
        description: message
      });
    } catch (error: any) {
      console.error(`Failed to ${action} student:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} student`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = !searchTerm.trim() ||
        (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.phone && student.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesProgram =
        programFilter === "all" ||
        (student.program && student.program.toLowerCase().includes(programFilter.toLowerCase()));

      return matchesSearch && matchesProgram;
    });
  }, [students, searchTerm, programFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200';
      case 'suspended':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200';
      default:
        return 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200';
    }
  };

  const getActionButtons = (student: Student) => {
    const status = student.status || 'active';

    switch (status) {
      case 'active':
        return [
          {
            label: 'Deactivate',
            icon: UserX,
            action: 'deactivate' as const,
            className: 'text-red-600',
            confirmTitle: 'Deactivate Student',
            confirmDesc: `Are you sure you want to deactivate ${student.name}? This will hide them from daily operations but preserve their history.`
          },
          {
            label: 'Suspend',
            icon: UserMinus,
            action: 'suspend' as const,
            className: 'text-orange-600',
            confirmTitle: 'Suspend Student',
            confirmDesc: `Are you sure you want to suspend ${student.name}? They will be restricted from attendance and payments.`
          }
        ];
      case 'inactive':
      case 'suspended':
        return [
          {
            label: 'Activate',
            icon: UserCheck,
            action: 'activate' as const,
            className: 'text-green-600',
            confirmTitle: 'Activate Student',
            confirmDesc: `Are you sure you want to activate ${student.name}? They will be restored to active status.`
          }
        ];
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading students...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Students</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage student enrollments and profiles.</p>
          </div>
          <Link href="/students/add">
            <Button className="w-full sm:w-auto gap-2 shadow-md h-10">
              <Plus className="h-4 w-4" />
              Add Student
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full lg:flex-1">
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                  <Select value={programFilter} onValueChange={setProgramFilter}>
                    <SelectTrigger className="w-full sm:w-40 lg:w-48">
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.name}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-36 lg:w-44">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="all">All Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-muted/30 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="text-muted-foreground font-medium">
                  {students.length === 0 ? "No students found." : "No students match your search criteria."}
                </div>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <div className="min-w-[1000px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Status</TableHead>
                        {user?.role === 'admin' && <TableHead>Branch</TableHead>}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.email || '-'}</TableCell>
                          <TableCell>{student.phone || '-'}</TableCell>
                          <TableCell>{student.program || '-'}</TableCell>
                          <TableCell>{student.batch || '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(student.status || 'active')}>
                              {(student.status || 'active').charAt(0).toUpperCase() + (student.status || 'active').slice(1)}
                            </Badge>
                          </TableCell>
                          {user?.role === 'admin' && (
                            <TableCell>{student.branch_name || '-'}</TableCell>
                          )}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/students/${student.id}`} className="flex items-center">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/students/${student.id}/edit`} className="flex items-center">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {getActionButtons(student).map((actionBtn, index) => {
                                  const IconComponent = actionBtn.icon;
                                  return (
                                    <AlertDialog key={index}>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          onSelect={(e) => e.preventDefault()}
                                          className={actionBtn.className}
                                          disabled={actionLoading === student.id}
                                        >
                                          <IconComponent className="mr-2 h-4 w-4" />
                                          {actionBtn.label}
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>{actionBtn.confirmTitle}</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            {actionBtn.confirmDesc}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleStatusChange(student.id, actionBtn.action, student.name)}
                                            disabled={actionLoading === student.id}
                                          >
                                            {actionLoading === student.id ? 'Processing...' : 'Confirm'}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
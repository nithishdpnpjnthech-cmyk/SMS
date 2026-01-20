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
import { Link, useLocation } from "wouter";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active"); // NEW: Status filter
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [location] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const branchId = new URLSearchParams(window.location.search).get("branchId");

  useEffect(() => {
    setIsLoading(true);
    setStudents([]);
    loadStudents();
  }, [branchId, statusFilter]); // Reload when status filter changes

  const loadStudents = async () => {
    try {
      console.log("Loading students with status:", statusFilter);
      
      let data;
      if (user?.role === "admin") {
        data = await api.getStudents(branchId || undefined, statusFilter);
      } else {
        data = await api.getStudents(undefined, statusFilter);
      }
      
      const studentsArray: Student[] = Array.isArray(data) ? data : [];
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
      let response;
      let message;
      
      switch (action) {
        case 'deactivate':
          response = await fetch(`/api/students/${studentId}/deactivate`, { method: 'PATCH' });
          message = `${studentName} has been deactivated`;
          break;
        case 'activate':
          response = await fetch(`/api/students/${studentId}/activate`, { method: 'PATCH' });
          message = `${studentName} has been activated`;
          break;
        case 'suspend':
          response = await fetch(`/api/students/${studentId}/suspend`, { method: 'PATCH' });
          message = `${studentName} has been suspended`;
          break;
      }
      
      if (!response?.ok) {
        throw new Error(`Failed to ${action} student`);
      }
      
      // Reload students to reflect status change
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

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgram =
      programFilter === "all" || 
      student.program?.toLowerCase().includes(programFilter.toLowerCase());

    return matchesSearch && matchesProgram;
  });

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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Students</h1>
            <p className="text-muted-foreground">Manage student enrollments and profiles.</p>
          </div>
          <Link href="/students/add">
            <Button className="gap-2 shadow-md min-h-[44px] w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add New Student
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">
              Student Directory ({students.length} students)
              {branchId && <span className="text-sm text-muted-foreground ml-2">(Branch View)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, email, phone..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-[150px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="Karate">Karate</SelectItem>
                    <SelectItem value="Yoga">Yoga</SelectItem>
                    <SelectItem value="Bharatnatyam">Bharatnatyam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Student Name</TableHead>
                      <TableHead className="min-w-[120px] hidden sm:table-cell">Email</TableHead>
                      <TableHead className="min-w-[100px]">Phone</TableHead>
                      <TableHead className="min-w-[100px] hidden md:table-cell">Program</TableHead>
                      <TableHead className="min-w-[80px] hidden lg:table-cell">Batch</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => {
                        const actionButtons = getActionButtons(student);
                        return (
                          <TableRow key={student.id} className="hover:bg-muted/50">
                            <TableCell className="min-w-[150px]">
                              <div className="flex flex-col">
                                <span className="font-medium">{student.name}</span>
                                <span className="text-xs text-muted-foreground font-mono">{student.id?.slice(0, 8)}</span>
                                <span className="text-xs text-muted-foreground sm:hidden">{student.email || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm hidden sm:table-cell">{student.email || 'N/A'}</TableCell>
                            <TableCell className="text-sm">{student.phone || 'N/A'}</TableCell>
                            <TableCell className="hidden md:table-cell">{student.program || 'N/A'}</TableCell>
                            <TableCell className="hidden lg:table-cell">{student.batch || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={getStatusBadge(student.status || 'active')}>
                                {student.status || 'active'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 min-h-[44px] min-w-[44px]">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/students/${student.id}`} className="cursor-pointer">
                                      <Eye className="mr-2 h-4 w-4" /> View Profile
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/students/${student.id}/edit`} className="cursor-pointer">
                                      <Edit className="mr-2 h-4 w-4" /> Edit Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {actionButtons.map((button, index) => (
                                    <AlertDialog key={index}>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem 
                                          className={`${button.className} cursor-pointer`}
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <button.icon className="mr-2 h-4 w-4" /> {button.label}
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="mx-4 max-w-md">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>{button.confirmTitle}</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            {button.confirmDesc}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                          <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleStatusChange(student.id, button.action, student.name)}
                                            className="min-h-[44px]"
                                            disabled={actionLoading === student.id}
                                          >
                                            {actionLoading === student.id ? `${button.label}ing...` : button.label}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          {students.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground mb-4">
                                {statusFilter === 'active' ? 'No active students found.' :
                                 statusFilter === 'inactive' ? 'No inactive students found.' :
                                 'No suspended students found.'}
                              </p>
                              {statusFilter === 'active' && (
                                <Link href="/students/add">
                                  <Button className="min-h-[44px]">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Student
                                  </Button>
                                </Link>
                              )}
                            </div>
                          ) : (
                            "No students match your search criteria."
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
      </div>
    </DashboardLayout>
  );
}
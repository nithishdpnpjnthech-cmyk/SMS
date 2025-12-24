import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function StudentList() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const studentsData = await api.getStudents();
      setStudents(studentsData);
      console.log("Students loaded:", studentsData);
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    setDeleteLoading(studentId);
    try {
      await api.deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      toast({
        title: "Success",
        description: `${studentName} has been deactivated successfully`
      });
    } catch (error: any) {
      console.error("Failed to deactivate student:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate student",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = programFilter === "all" || student.program === programFilter;
    return matchesSearch && matchesProgram;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Students</h1>
            <p className="text-muted-foreground">Manage student enrollments and profiles.</p>
          </div>
          <Link href="/students/add">
            <Button className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Add New Student
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Student Directory ({students.length} students)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, email, phone, or ID..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{student.id?.slice(0, 8)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{student.email || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{student.phone || 'N/A'}</TableCell>
                        <TableCell>{student.program || 'N/A'}</TableCell>
                        <TableCell>{student.batch || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'} 
                            className={
                              student.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : 
                              student.status === 'inactive' ? 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200' : 
                              'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200'
                            }
                          >
                            {student.status || 'active'}
                          </Badge>
                        </TableCell>
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
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="text-red-600 cursor-pointer" 
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Deactivate Student
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Deactivate Student</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to deactivate <strong>{student.name}</strong>? 
                                      This will hide the student from daily operations but preserve their attendance and fee history.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteStudent(student.id, student.name)}
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={deleteLoading === student.id}
                                    >
                                      {deleteLoading === student.id ? "Deactivating..." : "Deactivate"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {students.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No students found. Add your first student!</p>
                            <Link href="/students/add">
                              <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Student
                              </Button>
                            </Link>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

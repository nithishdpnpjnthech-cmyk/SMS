import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";

export default function EditStudent() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/students/:id/edit");
  const [isLoading, setIsLoading] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [uniformIssued, setUniformIssued] = useState(false);
  const [uniformSize, setUniformSize] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  useEffect(() => {
    if (!hasPermission('students.write')) {
      setLocation('/students');
      return;
    }
    if (params?.id) {
      loadStudentData(params.id);
      loadFormData();
    }
  }, [params?.id]);

  const loadStudentData = async (studentId: string) => {
    try {
      const studentData = await api.getStudent(studentId);
      setStudent(studentData);

      // Set uniform state from student data
      setUniformIssued(studentData.uniform_issued || false);
      setUniformSize(studentData.uniform_size || undefined);
    } catch (error) {
      console.error("Failed to load student:", error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive"
      });
      setLocation('/students');
    }
  };

  const loadFormData = async () => {
    try {
      const [branchesData, batchesData, programsData] = await Promise.all([
        api.getBranches(),
        api.getBatches(),
        api.getPrograms()
      ]);

      setBranches(branchesData || []);
      setBatches(batchesData || []);
      setPrograms(programsData || []);
    } catch (error) {
      console.error("Failed to load form data:", error);
      setBranches([]);
      setBatches([]);
      setPrograms([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsLoading(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);

      // Validate uniform fields
      if (uniformIssued && !uniformSize) {
        toast({
          title: "Validation Error",
          description: "Please select uniform size when uniform is issued",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const updateData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        parentPhone: formData.get("parentPhone") as string,
        guardianName: formData.get("guardianName") as string,
        address: formData.get("address") as string,
        branchId: formData.get("branchId") as string,
        program: formData.get("program") as string,
        batch: formData.get("batch") as string,
        uniformIssued: uniformIssued,
        uniformSize: uniformIssued ? uniformSize : null,
        status: formData.get("status") as string
      };

      await api.updateStudent(student.id, updateData);

      toast({
        title: "Success!",
        description: "Student updated successfully"
      });

      setLocation('/students');
    } catch (error: any) {
      console.error("Failed to update student:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading student...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/students')} className="h-8 w-8 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Edit Student</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Update student information</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input name="name" defaultValue={student.name} required />
              </div>

              <div>
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={student.email || ""} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Phone *</Label>
                  <Input name="phone" defaultValue={student.phone || ""} required />
                </div>
                <div>
                  <Label>Parent Phone</Label>
                  <Input name="parentPhone" defaultValue={student.parent_phone || ""} />
                </div>
              </div>

              <div>
                <Label>Guardian Name</Label>
                <Input name="guardianName" defaultValue={student.guardian_name || ""} />
              </div>

              <div>
                <Label>Address</Label>
                <Textarea name="address" defaultValue={student.address || ""} rows={3} />
              </div>

              <div>
                <Label>Branch *</Label>
                <Select name="branchId" defaultValue={student.branch_id}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Program *</Label>
                <Select name="program" defaultValue={student.program}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.name}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Batch *</Label>
                <Select name="batch" defaultValue={student.batch}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.name}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status *</Label>
                <Select name="status" defaultValue={student.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Uniform Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium">Uniform Information</h3>

                {/* Uniform Issued */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uniformIssued"
                    checked={uniformIssued}
                    onCheckedChange={(checked) => {
                      setUniformIssued(checked as boolean);
                      if (!checked) {
                        setUniformSize(undefined);
                      }
                    }}
                  />
                  <Label htmlFor="uniformIssued">Uniform Issued</Label>
                </div>

                {/* Uniform Size - Only show when uniform is issued */}
                {uniformIssued && (
                  <div>
                    <Label>Uniform Size *</Label>
                    <Select value={uniformSize} onValueChange={setUniformSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select uniform size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XS">XS</SelectItem>
                        <SelectItem value="S">S</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="XL">XL</SelectItem>
                        <SelectItem value="XXL">XXL</SelectItem>
                        <SelectItem value="XXXL">XXXL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setLocation('/students')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Student
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
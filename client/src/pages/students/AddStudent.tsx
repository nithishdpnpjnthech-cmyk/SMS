import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Loader2, CreditCard, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

export default function AddStudent() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(undefined);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [uniformIssued, setUniformIssued] = useState(false);
  const [uniformSize, setUniformSize] = useState<string | undefined>(undefined);
  const [showIdCard, setShowIdCard] = useState(false);
  const [idCardData, setIdCardData] = useState<any>(null);
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFormData();
  }, []);

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
      
      // Set defaults only if data exists
      if (branchesData && branchesData.length > 0) {
        setSelectedBranch(branchesData[0].id);
      }
      // Don't set defaults for batches/programs if empty - user will enter manually
    } catch (error) {
      console.error("Failed to load form data:", error);
      // Set empty arrays on error
      setBranches([]);
      setBatches([]);
      setPrograms([]);
      toast({
        title: "Warning",
        description: "Could not load dropdown data. You can still enter values manually.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // IMMEDIATE: Prevent any double submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      // Validate required fields
      if (!selectedBranch) {
        toast({
          title: "Validation Error",
          description: "Please select a branch",
          variant: "destructive"
        });
        return;
      }
      
      if (!selectedPrograms || selectedPrograms.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one program",
          variant: "destructive"
        });
        return;
      }
      
      if (!selectedBatch) {
        toast({
          title: "Validation Error",
          description: "Please select a batch",
          variant: "destructive"
        });
        return;
      }
      
      // Validate uniform fields
      if (uniformIssued && !uniformSize) {
        toast({
          title: "Validation Error",
          description: "Please select uniform size when uniform is issued",
          variant: "destructive"
        });
        return;
      }
      
      const studentData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        parentPhone: formData.get("parentPhone") as string,
        guardianName: formData.get("guardianName") as string,
        address: formData.get("address") as string,
        branchId: selectedBranch,
        programs: selectedPrograms,
        batchId: selectedBatch,
        uniformIssued: uniformIssued,
        uniformSize: uniformIssued ? uniformSize : null,
        status: selectedStatus
      };

      console.log("Creating student with data:", studentData);

      // CRITICAL: Single API call for student creation
      const student = await api.createStudent(studentData);
      console.log("Student created successfully:", student);

      // Show success message
      toast({
        title: "Success!",
        description: student.message || "Student added successfully"
      });

      // Optional: Try to generate ID card (non-blocking)
      if (student && student.id) {
        try {
          console.log("Generating ID card for student:", student.id);
          const idCard = await api.generateIdCard(student.id);
          console.log("ID card generated:", idCard);
          
          // Show ID card modal
          setIdCardData({
            ...student,
            studentId: student.id,
            joiningDate: new Date().toLocaleDateString()
          });
          setShowIdCard(true);
        } catch (idError) {
          console.error("ID card generation failed (non-critical):", idError);
          // Don't show error for ID card failure - student creation was successful
          setLocation("/students");
        }
      } else {
        // Navigate to students list if no ID card needed
        setLocation("/students");
      }
      
    } catch (error: any) {
      console.error("Failed to add student:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseIdCard = () => {
    setShowIdCard(false);
    setLocation("/students");
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          // Skip elements that might cause CSS parsing issues
          return element.tagName === 'STYLE' || element.tagName === 'SCRIPT';
        }
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `student-id-${idCardData?.studentId || 'unknown'}.png`;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download ID card. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Add New Student</h1>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <Label>Full Name *</Label>
                <Input name="name" required placeholder="Enter student's full name" />
              </div>
              
              {/* Email */}
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="student@example.com" />
              </div>
              
              {/* Phone */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Phone *</Label>
                  <Input name="phone" required placeholder="Student phone" />
                </div>
                <div>
                  <Label>Parent Phone</Label>
                  <Input name="parentPhone" placeholder="Parent/Guardian phone" />
                </div>
              </div>

              {/* Guardian Name */}
              <div>
                <Label>Guardian Name</Label>
                <Input name="guardianName" placeholder="Guardian/Parent name" />
              </div>

              {/* Address */}
              <div>
                <Label>Address</Label>
                <Textarea name="address" placeholder="Enter full address" rows={3} />
              </div>

              {/* Branch */}
              <div>
                <Label>Branch *</Label>
                {branches.length > 0 ? (
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.filter(branch => branch.id && branch.name).map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground p-2 border rounded">
                    No branches available. Contact admin to create branches.
                  </div>
                )}
              </div>

              {/* Programs */}
              <div>
                <Label>Programs * (Select one or more)</Label>
                {programs.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-3">
                    {programs.map((program) => (
                      <div key={program.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={program.id}
                          checked={selectedPrograms.includes(program.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPrograms([...selectedPrograms, program.id]);
                            } else {
                              setSelectedPrograms(selectedPrograms.filter(id => id !== program.id));
                            }
                          }}
                        />
                        <Label htmlFor={program.id} className="text-sm font-normal">
                          {program.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-2 border rounded">
                    No programs available. Contact admin to add programs.
                  </div>
                )}
              </div>

              {/* Batch */}
              <div>
                <Label>Batch *</Label>
                {batches.length > 0 ? (
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground p-2 border rounded">
                    No batches available. Contact admin to add batches.
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <Label>Status *</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
                <Button type="button" variant="outline" onClick={() => setLocation("/students")}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || branches.length === 0 || programs.length === 0 || batches.length === 0 || selectedPrograms.length === 0 || !selectedBatch}
                  className={isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Creating Student..." : "Add Student"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ID Card Modal */}
      <Dialog open={showIdCard} onOpenChange={setShowIdCard}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Student ID Card Generated
            </DialogTitle>
          </DialogHeader>
          
          {idCardData && (
            <div className="space-y-4">
              {/* ID Card Preview */}
              <div ref={cardRef} className="bg-gradient-to-br from-blue-600 to-purple-700 text-white p-6 rounded-lg shadow-lg">
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-lg">ACADEMY MASTER</h3>
                  <div className="bg-white/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-2xl font-bold">
                    {idCardData.name?.charAt(0) || 'S'}
                  </div>
                  <h4 className="font-semibold text-lg">{idCardData.name}</h4>
                  <div className="text-sm space-y-1">
                    <p>ID: {idCardData.studentId?.slice(0, 8)}</p>
                    <p>Program: {selectedPrograms.map(id => programs.find(p => p.id === id)?.name).join(', ')}</p>
                    <p>Batch: {batches.find(b => b.id === selectedBatch)?.name}</p>
                    <p>Joined: {idCardData.joiningDate}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCloseIdCard} className="flex-1">
                  Continue
                </Button>
                <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
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
          description: "Please select a branch. If no branches are available, contact admin to create one.",
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
        scale: 3, // Higher resolution
        backgroundColor: "#f97316", // Force solid orange background
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Robust selector for the card during capture
          const card = clonedDoc.querySelector('[data-card="id-card"]') as HTMLElement;
          if (card) {
            card.style.width = "480px";
            card.style.height = "300px";
            card.style.borderRadius = "24px";
            card.style.transform = "none"; // Avoid issues with 3D transforms
          }
        }
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `student-id-${idCardData?.name || 'student'}.png`;
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
      <div className="max-w-2xl mx-auto space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Add New Student</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Enroll a new student into the academy programs.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <Label>Student Name *</Label>
                <Input name="name" required placeholder="Enter student's full name" />
              </div>

              {/* Email */}
              <div>
                <Label>Parent Email</Label>
                <Input name="email" type="email" placeholder="parent@example.com" />
              </div>

              {/* Phone */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Student Phone Number *</Label>
                  <Input name="phone" required placeholder="Student phone" />
                </div>
                <div>
                  <Label>Parent Phone Number</Label>
                  <Input name="parentPhone" placeholder="Parent/Guardian phone" />
                </div>
              </div>

              {/* Guardian Name */}
              <div>
                <Label>Parent/Guardian Name</Label>
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
                <Label>Program Name * (Select one or more)</Label>
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
                  disabled={isSubmitting || branches.length === 0 || programs.length === 0 || batches.length === 0 || selectedPrograms.length === 0 || !selectedBatch || !selectedBranch}
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
        <DialogContent className="max-w-md bg-white border-0 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-3 text-xl font-black font-heading tracking-tight">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                <CreditCard className="h-6 w-6" />
              </div>
              Student ID Card Generated
            </DialogTitle>
          </DialogHeader>

          {idCardData && (
            <div className="p-6 space-y-6">
              {/* ID Card Preview - Premium Identity Card Design */}
              <div
                ref={cardRef}
                data-card="id-card"
                className="relative w-full aspect-[1.6/1] bg-[#f97316] text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between"
                style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
              >
                {/* Decorative Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

                {/* Card Header */}
                <div className="relative z-10 p-6 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h3 className="font-black text-sm tracking-[0.2em] uppercase opacity-90">STUDENT IDENTITY</h3>
                    <div className="h-0.5 w-8 bg-white/50 rounded-full"></div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md">ACADEMY PASS</span>
                  </div>
                </div>

                {/* Card Center Body */}
                <div className="relative z-10 px-6 flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 bg-white rounded-2xl p-3 shadow-xl transform rotate-3 flex items-center justify-center">
                      <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                      <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h4 className="text-2xl font-black font-heading tracking-tight truncate leading-none mb-1 uppercase">{idCardData.name}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70">ID: {idCardData.studentId?.slice(0, 8)}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedPrograms.slice(0, 2).map(id => (
                        <span key={id} className="text-[8px] font-black uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded leading-none">
                          {programs.find(p => p.id === id)?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer Details */}
                <div className="relative z-10 bg-black/20 backdrop-blur-md p-4 flex justify-between items-center border-t border-white/10">
                  <div className="flex gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/50">BATCH</p>
                      <p className="text-[10px] font-bold">{batches.find(b => b.id === selectedBatch)?.name || 'N/A'}</p>
                    </div>
                    <div className="space-y-0.5 border-l border-white/10 pl-4">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/50">JOINED</p>
                      <p className="text-[10px] font-bold">{idCardData.joiningDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black tracking-tighter opacity-80 uppercase">HUURA ACADEMY</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleCloseIdCard}
                  className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black uppercase text-xs tracking-widest rounded-xl transition-all"
                >
                  Continue
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
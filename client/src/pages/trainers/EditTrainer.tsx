import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function EditTrainer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, params] = useRoute("/trainers/:id/edit");
  const [location, setLocation] = useLocation();
  // Fallback to extracting ID from location if params are missing (wouter issue workaround)
  const trainerId = params?.id || location.split('/')[2];

  const [trainer, setTrainer] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    branchId: ""
  });

  useEffect(() => {
    if (trainerId) {
      loadData();
    }
  }, [trainerId]);

  const loadData = async () => {
    if (!trainerId) return;

    setIsLoading(true);
    try {
      const [trainerData, branchesData] = await Promise.all([
        api.getTrainer(trainerId),
        api.getBranches()
      ]);

      setTrainer(trainerData);
      setBranches(branchesData || []);

      // Initialize form data
      if (trainerData) {
        setFormData({
          name: trainerData.name || "",
          email: trainerData.email || "",
          phone: trainerData.phone || "",
          specialization: trainerData.specialization || "",
          // Handle both snake_case and camelCase just in case
          branchId: trainerData.branchId || trainerData.branch_id || ""
        });
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load trainer details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerId) return;

    setIsSaving(true);
    try {
      await api.updateTrainer(trainerId, formData);
      toast({
        title: "Success",
        description: "Trainer profile updated successfully"
      });
      // Navigate back to profile
      setLocation(`/trainers/${trainerId}`);
    } catch (error: any) {
      console.error("Failed to update trainer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update trainer profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading trainer details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!trainer) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold mb-2">Trainer Not Found</h2>
          <p className="text-muted-foreground mb-4">The trainer you're trying to edit doesn't exist.</p>
          <Link href="/trainers">
            <Button variant="outline">Return to Trainer List</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-4">
          <Link href={`/trainers/${trainerId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Edit Trainer</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Update trainer information</p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Make changes to the trainer's profile here. Click save when you're done.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Select
                    name="specialization"
                    value={formData.specialization}
                    onValueChange={(val) => handleSelectChange("specialization", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Karate">Karate</SelectItem>
                      <SelectItem value="Yoga">Yoga</SelectItem>
                      <SelectItem value="Bharatnatyam">Bharatnatyam</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {user?.role === 'admin' && (
                  <div className="grid gap-2">
                    <Label htmlFor="branchId">Branch</Label>
                    <Select
                      name="branchId"
                      value={formData.branchId}
                      onValueChange={(val) => handleSelectChange("branchId", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
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
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/trainers/${trainerId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

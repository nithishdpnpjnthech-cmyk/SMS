import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function TrainerList() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(undefined);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadTrainers();
    loadBranches();
  }, [location]);

  const loadBranches = async () => {
    try {
      const branchesData = await api.getBranches();
      setBranches(branchesData || []);
      
      // Set default branch for managers
      if (user?.role === 'manager' && user?.branchId) {
        setSelectedBranch(user.branchId);
      }
    } catch (error) {
      console.error("Failed to load branches:", error);
      setBranches([]);
    }
  };

  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      // Determine branch ID based on user role
      let branchId = selectedBranch;
      if (user?.role === 'manager') {
        branchId = user.branchId; // Manager can only add to their branch
      }
      
      if (!branchId) {
        toast({
          title: "Validation Error",
          description: "Please select a branch for the trainer",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      const trainerData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        specialization: formData.get('specialization') as string,
        branchId
      };

      console.log('Creating trainer with data:', trainerData);
      const result = await api.createTrainer(trainerData);
      await loadTrainers();
      setShowAddModal(false);
      setSelectedBranch(undefined);
      
      // Show success with login credentials
      toast({
        title: "Trainer Created Successfully!",
        description: `Login: ${result.username} / Password: ${result.defaultPassword}`,
        duration: 8000
      });
    } catch (error: any) {
      console.error('Failed to add trainer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add trainer. Please check all required fields.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!confirm('Are you sure you want to remove this trainer?')) return;
    
    try {
      await api.deleteTrainer(trainerId);
      await loadTrainers();
      toast({
        title: "Success",
        description: "Trainer removed successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove trainer",
        variant: "destructive"
      });
    }
  };

  const loadTrainers = async () => {
    try {
      let trainersData;
      if (user?.role === "admin") {
        const branchId = new URLSearchParams(window.location.search).get("branchId");
        trainersData = await api.getTrainers(branchId || undefined);
      } else {
        trainersData = await api.getTrainers();
      }
      
      setTrainers(trainersData);
      console.log("Trainers loaded:", trainersData);
    } catch (error) {
      console.error("Failed to load trainers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrainers = trainers.filter(trainer => 
    trainer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading trainers...</p>
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
            <h1 className="text-3xl font-bold tracking-tight font-heading">Trainers</h1>
            <p className="text-muted-foreground">Manage academy trainers and instructors.</p>
          </div>
          <Button className="gap-2 shadow-md" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add New Trainer
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Trainer Directory ({trainers.length} trainers)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or specialization..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrainers.length > 0 ? (
                    filteredTrainers.map((trainer) => (
                      <TableRow key={trainer.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={trainer.avatar} alt={trainer.name} />
                              <AvatarFallback>{trainer.name?.charAt(0) || 'T'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{trainer.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{trainer.id?.slice(0, 8)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{trainer.email || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{trainer.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trainer.specialization || 'General'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {user?.role === 'admin' ? (
                            <Badge variant="secondary">{trainer.branch_name || 'Unknown'}</Badge>
                          ) : (
                            trainer.branch_name || 'Main Branch'
                          )}
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
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation(`/trainers/${trainer.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation(`/trainers/${trainer.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => handleDeleteTrainer(trainer.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {trainers.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No trainers found. Add your first trainer!</p>
                            <Button onClick={() => setShowAddModal(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add First Trainer
                            </Button>
                          </div>
                        ) : (
                          "No trainers match your search criteria."
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Trainer Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Trainer</DialogTitle>
              <DialogDescription>
                Add a new trainer to your academy. Fill in their details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTrainer}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="Enter trainer's full name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="trainer@academy.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" placeholder="+1 (555) 123-4567" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Select name="specialization" required>
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
                    <Label htmlFor="branch">Branch *</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch} required>
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
                    {branches.length === 0 && (
                      <p className="text-sm text-muted-foreground">No branches available</p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Trainer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
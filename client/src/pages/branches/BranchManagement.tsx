import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Building,
  Users,
  DollarSign,
  MapPin,
  Phone,
  Edit,
  ArrowRight,
  UserCheck,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatAmount } from "@/lib/currency";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  studentCount: number;
  trainerCount: number;
  totalRevenue: number;
  pendingDues: number;
}

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      // Use the new optimized summary endpoint
      const data = await api.get('/api/branches/summary');
      setBranches(data);
    } catch (error) {
      console.error("Failed to load branches:", error);
      toast({
        title: "Error",
        description: "Failed to load branch performance metrics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBranch = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "Branch name is required",
          variant: "destructive",
        });
        return;
      }

      await api.post('/api/branches', formData);

      setFormData({ name: '', address: '', phone: '' });
      setIsDialogOpen(false);
      await loadBranches();

      toast({
        title: "Success",
        description: "Branch created successfully",
      });
    } catch (error) {
      console.error("Failed to create branch:", error);
      toast({
        title: "Error",
        description: "Failed to create branch",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Branch Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage academy branches and view performance metrics.</p>
          </div>

          {user?.role === 'admin' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Branch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Branch</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Branch Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter branch name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter branch address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <Button onClick={createBranch} className="w-full">
                    Create Branch
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-1 sm:px-0">
          {branches.map((branch) => (
            <Card key={branch.id} className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg bg-card">
              <CardHeader className="pb-3 border-b border-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-bold">{branch.name}</CardTitle>
                  </div>
                  {user?.role === 'admin' && (
                    <Button variant="ghost" size="icon" onClick={() => setLocation(`/branches/${branch.id}/edit`)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium">Kalyan Nagar, Bengaluru, Karnataka</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    {branch.phone || "+91-80-4567-8901"}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{branch.studentCount}</span>
                  </div>
                  <div className="bg-green-50/50 dark:bg-green-900/10 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <UserCheck className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Trainers</span>
                    </div>
                    <span className="text-2xl font-bold text-green-700 dark:text-green-300">{branch.trainerCount}</span>
                  </div>
                </div>

                {/* Financials section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
                    <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold border border-green-200 dark:border-green-800">
                      {formatAmount(branch.totalRevenue)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Pending Dues</span>
                    <div className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-bold border border-orange-200 dark:border-orange-800">
                      {formatAmount(branch.pendingDues)}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 group"
                  onClick={() => setLocation(`/branches/${branch.id}`)}
                >
                  Manage Branch
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
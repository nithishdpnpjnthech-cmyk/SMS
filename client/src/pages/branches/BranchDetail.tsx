import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Users, IndianRupee, UserCheck, Edit, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { formatAmount } from "@/lib/currency";

export default function BranchDetail() {
  const [match, params] = useRoute("/branches/:id");
  const [, setLocation] = useLocation();
  const [branch, setBranch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role !== 'admin') {
      setLocation('/dashboard');
      return;
    }

    if (params?.id) {
      loadBranchDetails(params.id);
    }
  }, [params?.id, user]);

  const loadBranchDetails = async (branchId: string) => {
    try {
      const branchData = await api.getBranchDetails(branchId);
      setBranch(branchData);
    } catch (error: any) {
      console.error("Failed to load branch details:", error);

      if (error.message.includes('404') || error.message.includes('not found')) {
        toast({
          title: "Branch Not Found",
          description: "The requested branch does not exist",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load branch details",
          variant: "destructive"
        });
      }

      setLocation('/branches');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading branch details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!branch) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Branch not found</p>
          <Button onClick={() => setLocation('/branches')} className="mt-4">
            Back to Branches
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/branches')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading flex items-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              {branch.name}
            </h1>
            <p className="text-muted-foreground">Branch management and performance overview</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Branch Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Contact Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Address:</strong> {branch.address}</p>
                  <p><strong>Phone:</strong> {branch.phone}</p>
                  <p><strong>Branch ID:</strong> {branch.id}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-medium">Students</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{branch.studentCount}</div>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <UserCheck className="h-4 w-4" />
                      <span className="text-xs font-medium">Trainers</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{branch.trainerCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 mb-2">
                {formatAmount(branch.totalRevenue)}
              </div>
              <p className="text-sm text-muted-foreground">
                All-time fees collected from this branch
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Pending Dues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700 mb-2">
                {formatAmount(branch.pendingDues)}
              </div>
              <p className="text-sm text-muted-foreground">
                Outstanding fees to be collected
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Branch Management Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setLocation(`/students?branchId=${branch.id}`)}
              >
                <Users className="h-6 w-6" />
                <span>View Students</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setLocation(`/trainers?branchId=${branch.id}`)}
              >
                <UserCheck className="h-6 w-6" />
                <span>View Trainers</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setLocation(`/fees?branchId=${branch.id}`)}
              >
                <IndianRupee className="h-6 w-6" />
                <span>View Fees</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
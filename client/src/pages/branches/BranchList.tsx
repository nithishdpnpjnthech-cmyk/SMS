import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Users,
  User,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";

export default function BranchDetail() {
  const { branchId } = useParams<{ branchId: string }>();
  const [, setLocation] = useLocation();
  const [branch, setBranch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (branchId) {
      loadBranch();
    }
  }, [branchId]);

  const loadBranch = async () => {
    try {
      const data = await api.getBranchDetails(branchId);
      setBranch(data);
      console.log("Branch loaded:", data);
    } catch (error) {
      console.error("Failed to load branch:", error);
      toast({
        title: "Error",
        description: "Failed to load branch details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading branch...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!branch) {
    return (
      <DashboardLayout>
        <p className="text-center text-muted-foreground">
          Branch not found
        </p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            {branch.name}
          </h1>
          <p className="text-muted-foreground">
            Branch overview & management
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{branch.name}</CardTitle>
                  <CardDescription>{branch.address}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Active
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {branch.phone}
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                Students:{" "}
                <span className="text-foreground font-medium">
                  {branch.studentCount}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Trainers:{" "}
                <span className="text-foreground font-medium">
                  {branch.trainerCount}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() =>
                  setLocation(`/students?branchId=${branch.id}`)
                }
              >
                View Students
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  setLocation(`/trainers?branchId=${branch.id}`)
                }
              >
                View Trainers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  setLocation(`/fees?branchId=${branch.id}`)
                }
              >
                View Fees
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
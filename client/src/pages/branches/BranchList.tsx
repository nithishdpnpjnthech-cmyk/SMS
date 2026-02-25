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
  UserCheck,
  CreditCard,
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
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
            {branch.name}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Branch overview & management
          </p>
        </div>

        <Card className="mx-1 sm:mx-0 shadow-sm border-muted/50 transition-shadow hover:shadow-md">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">{branch.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm line-clamp-1">{branch.address}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 text-[10px] sm:text-xs">
                Active
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-muted/50">
                <Phone className="h-4 w-4 text-primary" />
                <span className="truncate">{branch.phone}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-muted/50">
                <Users className="h-4 w-4 text-primary" />
                <span>
                  Students: <span className="text-foreground font-semibold">{branch.studentCount}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-muted/50">
                <User className="h-4 w-4 text-primary" />
                <span>
                  Trainers: <span className="text-foreground font-semibold">{branch.trainerCount}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full justify-between sm:justify-center gap-2 h-11 text-sm font-medium shadow-sm hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() =>
                  setLocation(`/students?branchId=${branch.id}`)
                }
              >
                <span>View Students</span>
                <Users className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between sm:justify-center gap-2 h-11 text-sm font-medium shadow-sm hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() =>
                  setLocation(`/trainers?branchId=${branch.id}`)
                }
              >
                <span>View Trainers</span>
                <UserCheck className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between sm:justify-center gap-2 h-11 text-sm font-medium shadow-sm hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() =>
                  setLocation(`/fees?branchId=${branch.id}`)
                }
              >
                <span>View Fees</span>
                <CreditCard className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
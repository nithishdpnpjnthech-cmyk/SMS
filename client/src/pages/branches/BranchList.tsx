import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Users, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BranchList() {
  const branches = [
    { id: 1, name: "Downtown Main Academy", address: "123 Main St, Cityville", manager: "Sarah Jenkins", students: 120, phone: "(555) 123-4567", status: "Active" },
    { id: 2, name: "Westside Dojo", address: "45 West Ave, Cityville", manager: "Mike Ross", students: 85, phone: "(555) 987-6543", status: "Active" },
    { id: 3, name: "North Hills Center", address: "789 North Blvd, Hillsdale", manager: "Emily Chen", students: 45, phone: "(555) 456-7890", status: "Active" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Branch Management</h1>
            <p className="text-muted-foreground">Oversee all academy locations and their performance.</p>
          </div>
          <Button>Add New Branch</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className="hover-elevate transition-all">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{branch.status}</Badge>
                </div>
                <CardTitle className="text-xl">{branch.name}</CardTitle>
                <CardDescription>{branch.address}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-foreground font-medium">Manager:</span> {branch.manager}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {branch.phone}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-foreground font-medium">{branch.students}</span> Active Students
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button variant="outline" className="w-full group">
                    Manage Branch 
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

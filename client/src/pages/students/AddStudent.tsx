import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AddStudent() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      await api.createStudent({
        name: `${formData.get("firstName")} ${formData.get("lastName")}`,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        parentPhone: formData.get("phone") as string,
        address: "",
        branchId: "default-branch",
        program: "Karate",
        batch: "Morning",
        status: "active"
      });

      alert("Student added successfully!");
      setLocation("/students");
    } catch (error) {
      alert("Failed to add student: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Add New Student</h1>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>First Name</Label>
                  <Input name="firstName" required />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input name="lastName" required />
                </div>
              </div>
              
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" />
              </div>
              
              <div>
                <Label>Phone</Label>
                <Input name="phone" required />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/students")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Student
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
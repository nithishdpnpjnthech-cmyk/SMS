import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function MasterData() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }
    loadMasterData();
  }, [user]);

  const loadMasterData = async () => {
    try {
      const [programsData, batchesData] = await Promise.all([
        api.getAdminPrograms(),
        api.getAdminBatches()
      ]);
      setPrograms(programsData || []);
      setBatches(batchesData || []);
    } catch (error) {
      console.error("Failed to load master data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const programData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string
      };

      await api.createProgram(programData);
      await loadMasterData();
      setShowProgramModal(false);

      toast({
        title: "Success",
        description: "Program created successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create program",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const batchData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string
      };

      await api.createBatch(batchData);
      await loadMasterData();
      setShowBatchModal(false);

      toast({
        title: "Success",
        description: "Batch created successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create batch",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProgramStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.updateProgramStatus(id, newStatus);
      await loadMasterData();

      toast({
        title: "Success",
        description: `Program ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update program",
        variant: "destructive"
      });
    }
  };

  const toggleBatchStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.updateBatchStatus(id, newStatus);
      await loadMasterData();

      toast({
        title: "Success",
        description: `Batch ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update batch",
        variant: "destructive"
      });
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
            <p>Loading master data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Master Data</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage programs and batches for student enrollment.</p>
          </div>
        </div>

        {/* Programs */}
        <Card className="mx-1 sm:mx-0 shadow-sm border-muted/50">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6">
            <CardTitle className="text-lg font-semibold">Programs ({programs.length})</CardTitle>
            <Button onClick={() => setShowProgramModal(true)} className="w-full sm:w-auto h-9">
              <Plus className="mr-2 h-4 w-4" />
              Add Program
            </Button>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="overflow-x-auto">
              <div className="min-w-[600px] w-full px-4 sm:px-0">
                {programs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programs.map((program) => (
                        <TableRow key={program.id}>
                          <TableCell className="font-medium">{program.name}</TableCell>
                          <TableCell>{program.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={(program.is_active ?? program.status === 'active') ? 'default' : 'secondary'}>
                              {program.is_active !== undefined ? (program.is_active ? 'active' : 'inactive') : program.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => toggleProgramStatus(program.id, program.is_active !== undefined ? (program.is_active ? 'active' : 'inactive') : program.status)}
                            >
                              {(program.is_active ?? program.status === 'active') ? 'Deactivate' : 'Activate'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No programs created yet.</p>
                    <Button onClick={() => setShowProgramModal(true)} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Program
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batches */}
        <Card className="mx-1 sm:mx-0 shadow-sm border-muted/50">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6">
            <CardTitle className="text-lg font-semibold">Batches ({batches.length})</CardTitle>
            <Button onClick={() => setShowBatchModal(true)} className="w-full sm:w-auto h-9">
              <Plus className="mr-2 h-4 w-4" />
              Add Batch
            </Button>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="overflow-x-auto">
              <div className="min-w-[600px] w-full px-4 sm:px-0">
                {batches.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.name}</TableCell>
                          <TableCell>{batch.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={(batch.is_active ?? batch.status === 'active') ? 'default' : 'secondary'}>
                              {batch.is_active !== undefined ? (batch.is_active ? 'active' : 'inactive') : batch.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => toggleBatchStatus(batch.id, batch.is_active !== undefined ? (batch.is_active ? 'active' : 'inactive') : batch.status)}
                            >
                              {(batch.is_active ?? batch.status === 'active') ? 'Deactivate' : 'Activate'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No batches created yet.</p>
                    <Button onClick={() => setShowBatchModal(true)} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Batch
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Program Modal */}
        <Dialog open={showProgramModal} onOpenChange={setShowProgramModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Program</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProgram}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Program Name *</Label>
                  <Input id="name" name="name" placeholder="e.g., Karate, Yoga, Bharatanatyam" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Optional description" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowProgramModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Program
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Batch Modal */}
        <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Batch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBatch}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Batch Name *</Label>
                  <Input id="name" name="name" placeholder="e.g., Morning, Evening, Weekend" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Optional description" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowBatchModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Batch
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
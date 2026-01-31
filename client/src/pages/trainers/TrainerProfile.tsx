import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, FileText, Edit, History } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { format } from "date-fns";

export default function TrainerProfile() {
  const { toast } = useToast();
  const [, params] = useRoute("/trainers/:id");
  const [location] = useLocation();
  // Fallback to extracting ID from location if params are missing (wouter issue workaround)
  const trainerId = params?.id || location.split('/')[2];
  
  const [trainer, setTrainer] = useState<any>(null);
  const [today, setToday] = useState<{ sessions: any[]; summary: any } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (trainerId) {
      loadTrainerData();
    }
  }, [trainerId]);

  const loadTrainerData = async () => {
    if (!trainerId) return;
    
    setIsLoading(true);
    try {
      let trainerData: any = null;

      try {
        trainerData = await api.getTrainer(trainerId);
      } catch (primaryError) {
        try {
          const allTrainers = await api.getTrainers();
          trainerData = Array.isArray(allTrainers)
            ? allTrainers.find((t) => t.id === trainerId)
            : null;
        } catch {
          throw primaryError;
        }
      }

      if (!trainerData) {
        setTrainer(null);
        setToday({ sessions: [], summary: { todayHours: 0, monthHours: 0, totalHours: 0 } });
        setHistory([]);
        return;
      }

      const [todayResp, historyResp] = await Promise.all([
        api.getTrainerAttendanceToday(trainerId).catch(() => ({ sessions: [], summary: { todayHours: 0, monthHours: 0, totalHours: 0 } })),
        api.getTrainerAttendanceRange(trainerId, {
          from: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
          to: new Date().toISOString().slice(0, 10),
          limit: 50,
          offset: 0
        }).catch(() => [])
      ]);
      
      setTrainer(trainerData);
      setToday(todayResp);
      setHistory(Array.isArray(historyResp) ? historyResp : []);
    } catch (error) {
      console.error("Failed to load trainer data:", error);
      toast({
        title: "Error",
        description: "Failed to load trainer profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading trainer profile...</p>
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
          <p className="text-muted-foreground mb-4">The trainer profile you're looking for doesn't exist.</p>
          <Link href="/trainers">
            <Button variant="outline">Return to Trainer List</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/trainers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Trainer Profile</h1>
            <p className="text-muted-foreground">View and manage trainer details</p>
          </div>
          <Link href={`/trainers/${trainer.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={trainer.avatar} alt={trainer.name} />
                  <AvatarFallback className="text-xl">{trainer.name?.charAt(0) || 'T'}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{trainer.name}</h2>
                <Badge variant="secondary" className="mt-2">
                  {trainer.specialization || 'General Trainer'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  ID: <span className="font-mono">{trainer.id?.slice(0, 8)}</span>
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{trainer.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{trainer.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{trainer.branch_name || 'Assigned Branch'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {trainer.created_at ? format(new Date(trainer.created_at), 'MMMM yyyy') : 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Tabs */}
          <div className="md:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                    <CardDescription>Today, month-to-date, lifetime</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      <Card className="bg-primary text-primary-foreground border-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg opacity-90">Today</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold">{today?.summary?.todayHours || 0}h</div>
                          <p className="text-sm opacity-80 mt-1">Worked hours</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">This Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold">{today?.summary?.monthHours || 0}h</div>
                          <p className="text-sm text-muted-foreground mt-1">Total hours</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Lifetime</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold">{today?.summary?.totalHours || 0}h</div>
                          <p className="text-sm text-muted-foreground mt-1">Across all sessions</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Today’s attendance</CardTitle>
                    <CardDescription>Sessions recorded today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {today?.sessions?.length ? (
                        today.sessions.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <History className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{s.location_type} — {s.location_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  In: {new Date(s.clock_in_time).toLocaleTimeString()} {s.clock_out_time ? `| Out: ${new Date(s.clock_out_time).toLocaleTimeString()}` : '| Open'}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">{s.status}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No sessions recorded today.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="attendance" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {history.length > 0 ? (
                        history.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>{(s.location_name || 'L').charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{s.date?.slice(0, 10)} — {s.location_type} — {s.location_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  In: {new Date(s.clock_in_time).toLocaleTimeString()} | Out: {s.clock_out_time ? new Date(s.clock_out_time).toLocaleTimeString() : 'Open'} | {s.total_hours ? `${s.total_hours}h` : ''}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">{s.status}</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No past attendance recorded.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

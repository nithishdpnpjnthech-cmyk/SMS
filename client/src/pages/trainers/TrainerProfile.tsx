import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, Edit, History } from "lucide-react";
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
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ todayHours: 0, monthHours: 0, totalHours: 0 });
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
        return;
      }

      setTrainer(trainerData);

      // Load today's sessions
      try {
        const todayRecords = await api.getTrainerAttendanceToday(trainerId);
        setTodaySessions(Array.isArray(todayRecords) ? todayRecords : []);
      } catch {
        setTodaySessions([]);
      }

      // Load history with summary
      try {
        const historyData = await api.getTrainerAttendanceHistory(trainerId, {
          from: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
          to: new Date().toISOString().slice(0, 10),
          limit: 50,
          offset: 0
        });
        setHistory(historyData?.records || []);
        setSummary(historyData?.summary || { todayHours: 0, monthHours: 0, totalHours: 0 });
      } catch {
        setHistory([]);
      }
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

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatWorkedTime = (minutes: number | null) => {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Link href="/trainers">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Trainer Profile</h1>
            </div>
          </div>
          <div className="flex-1 hidden sm:block">
            <p className="text-muted-foreground text-sm">View and manage trainer details</p>
          </div>
          <Link href={`/trainers/${trainer.id}/edit`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto mt-2 sm:mt-0 shadow-sm">
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
                <TabsTrigger value="attendance">Attendance History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                    <CardDescription>Today, month-to-date, lifetime</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Card className="bg-primary text-primary-foreground border-none shadow-md">
                        <CardHeader className="pb-2 px-4">
                          <CardTitle className="text-base opacity-90">Today</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                          <div className="text-3xl sm:text-4xl font-bold">{summary.todayHours}h</div>
                          <p className="text-xs sm:text-sm opacity-80 mt-1">Worked hours</p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2 px-4">
                          <CardTitle className="text-base">This Month</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                          <div className="text-3xl sm:text-4xl font-bold">{summary.monthHours}h</div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total hours</p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2 px-4">
                          <CardTitle className="text-base">Lifetime</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                          <div className="text-3xl sm:text-4xl font-bold">{summary.totalHours}h</div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Across all sessions</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Today's Sessions</CardTitle>
                    <CardDescription>Clock in / clock out records for today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {todaySessions.length > 0 ? (
                        todaySessions.map((s: any) => (
                          <div key={s.id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant={s.clock_out ? "secondary" : "default"} className={!s.clock_out ? "bg-green-500" : ""}>
                                {s.clock_out ? 'Completed' : '● Active'}
                              </Badge>
                              <span className="text-xs font-medium text-muted-foreground">
                                {s.worked_minutes ? formatWorkedTime(s.worked_minutes) : (!s.clock_out ? 'Ongoing' : '—')}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-green-50 rounded-lg p-2.5">
                                <p className="text-[10px] font-semibold text-green-600 uppercase mb-0.5">Clock In</p>
                                <p className="text-sm font-bold text-green-800">{formatTime(s.clock_in)}</p>
                              </div>
                              <div className={`rounded-lg p-2.5 ${s.clock_out ? 'bg-red-50' : 'bg-gray-50'}`}>
                                <p className={`text-[10px] font-semibold uppercase mb-0.5 ${s.clock_out ? 'text-red-600' : 'text-gray-400'}`}>Clock Out</p>
                                <p className={`text-sm font-bold ${s.clock_out ? 'text-red-800' : 'text-gray-400'}`}>
                                  {s.clock_out ? formatTime(s.clock_out) : '—'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{s.location || 'N/A'}</span>
                              {s.area && <span>• {s.area}</span>}
                            </div>
                            {s.notes && <p className="text-xs text-muted-foreground italic">📝 {s.notes}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No sessions recorded today.</p>
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
                    <div className="space-y-3">
                      {history.length > 0 ? (
                        history.map((s: any) => (
                          <div key={s.id} className="p-4 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">
                                  {s.date ? format(new Date(s.date), 'EEE, MMM d, yyyy') : '—'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                  {formatWorkedTime(s.worked_minutes)}
                                </span>
                                <Badge variant={s.status === 'clocked_out' ? "secondary" : "default"} className={s.status !== 'clocked_out' ? "bg-green-500" : ""}>
                                  {s.status === 'clocked_out' ? 'Completed' : 'Active'}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-green-50 rounded-lg p-2">
                                <p className="text-[10px] font-semibold text-green-600 uppercase">Clock In</p>
                                <p className="text-sm font-bold text-green-800">{formatTime(s.clock_in)}</p>
                              </div>
                              <div className={`rounded-lg p-2 ${s.clock_out ? 'bg-red-50' : 'bg-gray-50'}`}>
                                <p className={`text-[10px] font-semibold uppercase ${s.clock_out ? 'text-red-600' : 'text-gray-400'}`}>Clock Out</p>
                                <p className={`text-sm font-bold ${s.clock_out ? 'text-red-800' : 'text-gray-400'}`}>
                                  {s.clock_out ? formatTime(s.clock_out) : '—'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{s.location || 'N/A'}</span>
                              {s.area && <span>• {s.area}</span>}
                              {s.notes && <span className="italic">| 📝 {s.notes}</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No attendance records found in the last 30 days.</p>
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

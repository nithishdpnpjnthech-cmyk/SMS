import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, LogIn, LogOut, History as HistoryIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function TrainerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasOpenSession, setHasOpenSession] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadTrainerData();
  }, []);

  const loadTrainerData = async () => {
    try {
      console.log('Loading trainer data for user:', user?.id);
      const me = await api.get("/api/trainers/me");
      console.log('Trainer data received:', me);
      if (me?.id) {
        setTrainerId(me.id);
        await loadTodayAttendance(me.id);
      } else {
        toast({
          title: "Setup Required",
          description: "Please contact admin to link your trainer account",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Failed to load trainer data:", error);
      toast({
        title: "Error",
        description: "Failed to load trainer profile. Contact admin.",
        variant: "destructive"
      });
    }
  };

  const loadTodayAttendance = async (id: string) => {
    try {
      const records = await api.getTrainerAttendanceToday(id);
      setRecentActivity(records || []);
      setHasOpenSession(records.some((r: any) => !r.clock_out));
    } catch (error) {
      console.error("Failed to load attendance:", error);
    }
  };

  const handleClockIn = async () => {
    if (!trainerId) {
      toast({ title: "Error", description: "Trainer ID not found", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      console.log('Clock in with:', { trainerId, location, area, notes });
      await api.trainerClockIn(trainerId, {
        location: location.trim() || 'Not specified',
        area: area.trim() || undefined,
        notes: notes.trim() || undefined
      });
      toast({ title: "Success", description: "Clocked in successfully" });
      setLocation("");
      setArea("");
      setNotes("");
      await loadTodayAttendance(trainerId);
    } catch (error: any) {
      console.error('Clock in error:', error);
      toast({ title: "Error", description: error.message || "Failed to clock in", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!trainerId) {
      toast({ title: "Error", description: "Trainer ID not found", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      console.log('Clock out for trainer:', trainerId);
      await api.trainerClockOut(trainerId);
      toast({ title: "Success", description: "Clocked out successfully" });
      await loadTodayAttendance(trainerId);
    } catch (error: any) {
      console.error('Clock out error:', error);
      toast({ title: "Error", description: error.message || "Failed to clock out", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatActivityTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Trainer Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-card p-4 rounded-xl shadow-sm border border-muted/50">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner">
            <span className="text-xl sm:text-2xl font-bold text-primary">{user?.name?.[0] || 'T'}</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-heading">Trainer Portal</h1>
            <p className="text-sm text-muted-foreground font-medium">{user?.name || 'Trainer'}</p>
          </div>
          <div className="sm:ml-auto">
            <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-primary border-primary/20">
              Lead Trainer
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tracking Column */}
          <div className="space-y-6">
            <Card className="border-muted/50 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 sm:p-6 bg-muted/30 border-b border-muted/50 flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold font-heading">Live Time Tracking</h2>
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                  <div className="text-center py-6 bg-muted/20 rounded-2xl border border-muted/50 shadow-inner">
                    <p className="text-[10px] sm:text-xs font-bold text-primary/70 tracking-widest mb-2 uppercase">CURRENT TIME</p>
                    <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-foreground font-heading">{formatTime(currentTime)}</div>
                    <p className="text-sm sm:text-base font-medium text-muted-foreground mt-2">{formatDate(currentTime)}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground/80 flex items-center gap-1.5 ml-1">
                        <MapPin className="h-3 w-3" />
                        Branch / Location
                      </Label>
                      <Input
                        placeholder="e.g., Downtown Branch"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="bg-muted/10 border-muted/50 h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground/80 flex items-center gap-1.5 ml-1">
                        <MapPin className="h-3 w-3" />
                        Specific Area
                      </Label>
                      <Input
                        placeholder="e.g., Weight Room"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="bg-muted/10 border-muted/50 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground/80 flex items-center gap-1.5 ml-1">
                      <span>📝</span> Notes
                    </Label>
                    <Input
                      placeholder="Optional notes for this session..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-muted/10 border-muted/50 h-11"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white h-14 shadow-md transition-all active:scale-95"
                      onClick={handleClockIn}
                      disabled={loading || hasOpenSession}
                    >
                      <LogIn className="h-5 w-5 mr-2" />
                      Clock In
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="h-14 shadow-md transition-all active:scale-95"
                      onClick={handleClockOut}
                      disabled={loading || !hasOpenSession}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Clock Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Column */}
          <div>
            <Card className="border-muted/50 shadow-lg overflow-hidden h-full">
              <CardHeader className="bg-muted/30 border-b border-muted/50 flex flex-row items-center justify-between py-4 px-6">
                <CardTitle className="text-lg font-semibold font-heading">Recent Activity</CardTitle>
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3">
                  Today
                </Badge>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => {
                      const clockInDate = new Date(activity.clock_in);
                      const clockOutDate = activity.clock_out ? new Date(activity.clock_out) : null;
                      const workedMs = clockOutDate
                        ? clockOutDate.getTime() - clockInDate.getTime()
                        : (Date.now() - clockInDate.getTime());
                      const workedHours = Math.floor(workedMs / (1000 * 60 * 60));
                      const workedMins = Math.floor((workedMs % (1000 * 60 * 60)) / (1000 * 60));

                      return (
                        <div key={activity.id} className="p-4 rounded-xl border border-muted/50 bg-card hover:shadow-md transition-all duration-200 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge variant={activity.clock_out ? "secondary" : "default"} className={!activity.clock_out ? "bg-green-500 animate-pulse border-none" : ""}>
                              {activity.clock_out ? 'COMPLETED' : '● ACTIVE'}
                            </Badge>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-full border border-muted/50">
                              <HistoryIcon className="h-3 w-3" />
                              {workedHours > 0 ? `${workedHours}h ${workedMins}m` : `${workedMins}m`}
                              {!activity.clock_out && ' (ongoing)'}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50/50 border border-green-100 rounded-xl p-2.5">
                              <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter mb-0.5">IN</p>
                              <p className="text-sm font-black text-green-800 tracking-tight">{formatActivityTime(activity.clock_in)}</p>
                            </div>
                            <div className={`border rounded-xl p-2.5 ${activity.clock_out ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-tighter mb-0.5 ${activity.clock_out ? 'text-red-600' : 'text-gray-400'}`}>OUT</p>
                              <p className={`text-sm font-black tracking-tight ${activity.clock_out ? 'text-red-800' : 'text-gray-400'}`}>
                                {activity.clock_out ? formatActivityTime(activity.clock_out) : '—'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 text-primary/60" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">{activity.location}</p>
                              {activity.area && <p className="text-xs font-medium truncate opacity-80">{activity.area}</p>}
                            </div>
                          </div>
                          {activity.notes && (
                            <div className="pt-2 border-t border-muted/30">
                              <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                                <span>📝</span> {activity.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-muted-foreground space-y-3">
                      <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                        <Clock className="h-6 w-6" />
                      </div>
                      <p className="font-medium">No sessions recorded today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Profile Footer */}
        <Card className="border-muted/50 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-muted/50">
                <span className="text-lg font-bold text-primary">{user?.name?.[0] || 'T'}</span>
              </div>
              <div>
                <p className="font-bold text-foreground">{user?.name || 'Trainer'}</p>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <p className="text-xs text-muted-foreground font-medium">Verified Account</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

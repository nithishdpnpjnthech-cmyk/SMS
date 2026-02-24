import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, LogIn, LogOut } from "lucide-react";
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{user?.name?.[0] || 'T'}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">TrainerPro</h1>
            <p className="text-sm text-muted-foreground">{user?.name || 'Trainer'}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Time Tracking</h2>
                </div>

                <div className="text-center mb-8">
                  <p className="text-sm text-muted-foreground mb-2">CURRENT TIME</p>
                  <div className="text-6xl font-bold mb-2">{formatTime(currentTime)}</div>
                  <p className="text-primary font-medium">{formatDate(currentTime)}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., Downtown Branch"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>Specific Area</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., Weight Room, Studio A"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>✏️</span>
                      <span>Notes</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Anything to add?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-white h-14"
                    onClick={handleClockIn}
                    disabled={loading || hasOpenSession}
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Clock In
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-14"
                    onClick={handleClockOut}
                    disabled={loading || !hasOpenSession}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Clock Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-none shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full">Today</span>
                </div>

                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => {
                      // Calculate worked duration
                      const clockInDate = new Date(activity.clock_in);
                      const clockOutDate = activity.clock_out ? new Date(activity.clock_out) : null;
                      const workedMs = clockOutDate
                        ? clockOutDate.getTime() - clockInDate.getTime()
                        : (Date.now() - clockInDate.getTime());
                      const workedHours = Math.floor(workedMs / (1000 * 60 * 60));
                      const workedMins = Math.floor((workedMs % (1000 * 60 * 60)) / (1000 * 60));

                      return (
                        <div key={activity.id} className="p-4 rounded-lg border space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${activity.clock_out
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                              }`}>
                              {activity.clock_out ? 'COMPLETED' : '● ACTIVE SESSION'}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                              {workedHours > 0 ? `${workedHours}h ${workedMins}m` : `${workedMins}m`}
                              {!activity.clock_out && ' (ongoing)'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 rounded-lg p-2.5">
                              <p className="text-[10px] font-semibold text-green-600 uppercase mb-0.5">Clock In</p>
                              <p className="text-sm font-bold text-green-800">{formatActivityTime(activity.clock_in)}</p>
                            </div>
                            <div className={`rounded-lg p-2.5 ${activity.clock_out ? 'bg-red-50' : 'bg-gray-50'}`}>
                              <p className={`text-[10px] font-semibold uppercase mb-0.5 ${activity.clock_out ? 'text-red-600' : 'text-gray-400'}`}>Clock Out</p>
                              <p className={`text-sm font-bold ${activity.clock_out ? 'text-red-800' : 'text-gray-400'}`}>
                                {activity.clock_out ? formatActivityTime(activity.clock_out) : '—'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">{activity.location}</p>
                              {activity.area && <p className="text-xs text-muted-foreground">• {activity.area}</p>}
                            </div>
                          </div>
                          {activity.notes && (
                            <p className="text-xs text-muted-foreground italic">📝 {activity.notes}</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No activity today
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <span className="text-lg font-bold">{user?.name?.[0] || 'T'}</span>
              </div>
              <div>
                <p className="font-semibold">{user?.name || 'Trainer'}</p>
                <p className="text-sm text-muted-foreground">Lead Trainer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

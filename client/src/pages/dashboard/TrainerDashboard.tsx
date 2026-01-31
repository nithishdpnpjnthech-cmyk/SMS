import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, History } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function TrainerDashboard() {
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [today, setToday] = useState<{ sessions: any[]; summary: any } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [locationType, setLocationType] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      setIsLoading(true);
      const me = await api.get("/api/trainers/me");
      if (!me?.id) {
        setTrainerId(null);
        setToday({ sessions: [], summary: { todayHours: 0, monthHours: 0, totalHours: 0 } });
        setHistory([]);
        return;
      }
      setTrainerId(me.id);
      const [todayResp, historyResp] = await Promise.all([
        api.getTrainerAttendanceToday(me.id),
        api.getTrainerAttendanceRange(me.id, {
          from: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
          to: new Date().toISOString().slice(0, 10),
          limit: 50,
          offset: 0,
        }),
      ]);
      setToday(todayResp || { sessions: [], summary: { todayHours: 0, monthHours: 0, totalHours: 0 } });
      setHistory(Array.isArray(historyResp) ? historyResp : []);
    } catch (error) {
      setTrainerId(null);
      setToday({ sessions: [], summary: { todayHours: 0, monthHours: 0, totalHours: 0 } });
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasOpenSession = !!today?.sessions?.find((s: any) => s.status === "open");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading trainer portal...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Trainer Portal</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || 'Trainer'}.</p>
          </div>
        </div>

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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Attendance</CardTitle>
            <CardDescription>Clock in/out and record your location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="w-full">
                <Select value={locationType} onValueChange={setLocationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:col-span-2">
                <Input placeholder="Location name" value={locationName} onChange={(e) => setLocationName(e.target.value)} />
              </div>
              <div className="w-full">
                <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                className="gap-2"
                disabled={!trainerId || !locationType || !locationName || hasOpenSession || isClockingIn}
                onClick={async () => {
                  try {
                    setIsClockingIn(true);
                    await api.trainerClockIn(trainerId!, { locationType, locationName, notes });
                    const todayResp = await api.getTrainerAttendanceToday(trainerId!);
                    setToday(todayResp);
                    toast({ title: "Clocked in" });
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message || "Failed to clock in", variant: "destructive" });
                  } finally {
                    setIsClockingIn(false);
                  }
                }}
              >
                <Clock className="h-4 w-4" /> Clock In
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!trainerId || !hasOpenSession || isClockingOut}
                onClick={async () => {
                  try {
                    setIsClockingOut(true);
                    await api.trainerClockOut(trainerId!, { notes });
                    const todayResp = await api.getTrainerAttendanceToday(trainerId!);
                    setToday(todayResp);
                    toast({ title: "Clocked out" });
                  } catch (e: any) {
                    toast({ title: "Error", description: e.message || "Failed to clock out", variant: "destructive" });
                  } finally {
                    setIsClockingOut(false);
                  }
                }}
              >
                <Clock className="h-4 w-4" /> Clock Out
              </Button>
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

        <Card>
          <CardHeader>
            <CardTitle>Past attendance</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.length ? (
                history.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <History className="h-4 w-4 text-primary" />
                      </div>
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
                <p className="text-sm text-muted-foreground">No past sessions.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

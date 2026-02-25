import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function TrainerAttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminTrainerAttendance();
      setAttendance(data || []);
    } catch (error) {
      console.error("Failed to load trainer attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Trainer Attendance</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Monitor trainer clock-in/out activity</p>
        </div>

        <Card className="mx-1 sm:mx-0 shadow-sm border-muted/50 transition-shadow hover:shadow-md">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No trainer activity today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendance.map((record) => (
                  <div key={record.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border rounded-lg gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate text-gray-900">{record.trainer_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{record.branch_name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700">{record.location}</p>
                          {record.area && (
                            <p className="text-xs text-muted-foreground truncate">• {record.area}</p>
                          )}
                        </div>
                      </div>

                      {record.notes && (
                        <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground italic border-l-2 border-primary/30">
                          Note: {record.notes}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm pt-1">
                        <div className="flex items-center gap-1.5 text-green-600 font-medium whitespace-nowrap">
                          <Clock className="h-3.5 w-3.5" />
                          <span>In: {formatTime(record.clock_in)}</span>
                        </div>
                        {record.clock_out && (
                          <>
                            <div className="flex items-center gap-1.5 text-red-600 font-medium whitespace-nowrap">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Out: {formatTime(record.clock_out)}</span>
                            </div>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shadow-none">
                              {formatDuration(record.minutes_worked)}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="self-start">
                      <Badge className={`${record.clock_out ? "bg-gray-500 hover:bg-gray-600" : "bg-green-500 hover:bg-green-600"} shadow-sm px-2 py-0.5 text-[10px]`}>
                        {record.clock_out ? "Completed" : "Active"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

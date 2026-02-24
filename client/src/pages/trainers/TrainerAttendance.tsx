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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trainer Attendance</h1>
          <p className="text-muted-foreground">Monitor trainer clock-in/out activity</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No trainer activity today
              </div>
            ) : (
              <div className="space-y-4">
                {attendance.map((record) => (
                  <div key={record.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{record.trainer_name}</p>
                          <p className="text-sm text-muted-foreground">{record.branch_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{record.location}</p>
                          {record.area && (
                            <p className="text-sm text-muted-foreground">• {record.area}</p>
                          )}
                        </div>
                      </div>

                      {record.notes && (
                        <p className="text-sm text-muted-foreground pl-7">
                          Note: {record.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-4 pl-7 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>In: {formatTime(record.clock_in)}</span>
                        </div>
                        {record.clock_out && (
                          <>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>Out: {formatTime(record.clock_out)}</span>
                            </div>
                            <Badge variant="secondary">
                              {formatDuration(record.minutes_worked)}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    <Badge className={record.clock_out ? "bg-gray-500" : "bg-green-500"}>
                      {record.clock_out ? "Completed" : "Active"}
                    </Badge>
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

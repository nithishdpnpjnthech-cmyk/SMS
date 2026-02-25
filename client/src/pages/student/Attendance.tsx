import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { studentApi } from '@/lib/student-api';

interface AttendanceData {
  attendance: Array<{
    date: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
  }>;
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendancePercentage: number;
  };
}

export default function StudentAttendance() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const data = await studentApi.getAttendance();
      setAttendanceData(data as AttendanceData);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const CircularProgress = ({ percentage, size = 200 }: { percentage: number; size?: number }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10b981"
            strokeWidth="12"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{percentage}%</div>
            <div className="text-sm text-gray-600">Attendance</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!attendanceData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load attendance data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-heading">Attendance Record</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Detailed history of your class participation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Overview */}
        <Card className="shadow-lg border-muted/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-muted/50 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-heading">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col items-center space-y-8">
              <div className="scale-[0.8] sm:scale-100 origin-center py-2 relative">
                <CircularProgress percentage={attendanceData.summary.attendancePercentage} />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Absent</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 text-center w-full">
                <div className="bg-green-50/50 rounded-2xl py-4 px-3 sm:px-6 border border-green-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className="text-3xl sm:text-4xl font-black text-green-600 font-heading">
                    {attendanceData.summary.presentDays}
                  </div>
                  <div className="text-[10px] sm:text-xs text-green-700/70 uppercase font-black tracking-widest mt-1">
                    Days Present
                  </div>
                </div>
                <div className="bg-red-50/50 rounded-2xl py-4 px-3 sm:px-6 border border-red-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <div className="text-3xl sm:text-4xl font-black text-red-600 font-heading">
                    {attendanceData.summary.absentDays}
                  </div>
                  <div className="text-[10px] sm:text-xs text-red-700/70 uppercase font-black tracking-widest mt-1">
                    Days Absent
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card className="shadow-lg border-muted/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-muted/50 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-heading">Attendance History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {attendanceData.attendance.length > 0 ? (
              <div className="divide-y divide-muted/50 max-h-[500px] overflow-y-auto">
                {attendanceData.attendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-muted/20 transition-colors">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {new Date(record.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                      </p>
                      {(record.checkIn || record.checkOut) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] sm:text-xs text-muted-foreground/80 font-medium">
                          {record.checkIn && (
                            <span className="flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 text-green-700">
                              <Clock className="h-3 w-3" />
                              IN {new Date(record.checkIn).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                          {record.checkOut && (
                            <span className="flex items-center gap-1.5 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 text-red-700">
                              <Clock className="h-3 w-3" />
                              OUT {new Date(record.checkOut).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={record.status === 'present' ? 'default' : 'destructive'}
                      className={`px-3 py-1 font-bold ${record.status === 'present' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-none' : 'shadow-sm'}`}
                    >
                      {record.status === 'present' ? 'PRESENT' : 'ABSENT'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 px-6">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No Attendance Records</h3>
                <p className="text-sm text-muted-foreground">Class attendance data will appear here once recorded.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
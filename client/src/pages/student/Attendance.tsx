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
      setAttendanceData(data);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Record</h1>
        <p className="text-gray-600 mt-2">Detailed history of your class participation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6">
              <CircularProgress percentage={attendanceData.summary.attendancePercentage} />
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Absent</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {attendanceData.summary.presentDays}
                  </div>
                  <div className="text-sm text-gray-600 uppercase tracking-wide">
                    Days Present
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600">
                    {attendanceData.summary.absentDays}
                  </div>
                  <div className="text-sm text-gray-600 uppercase tracking-wide">
                    Days Absent
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceData.attendance.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {attendanceData.attendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-IN', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                      </p>
                      {(record.checkIn || record.checkOut) && (
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {record.checkIn && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              In: {new Date(record.checkIn).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                          {record.checkOut && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Out: {new Date(record.checkOut).toLocaleTimeString('en-IN', { 
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
                      className={record.status === 'present' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {record.status === 'present' ? 'Present' : 'Absent'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No attendance records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
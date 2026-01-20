import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  CreditCard, 
  Shirt, 
  BookOpen, 
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  IndianRupee
} from 'lucide-react';
import { useStudentAuth } from '@/lib/student-auth';
import { studentApi } from '@/lib/student-api';

interface DashboardData {
  attendance: {
    percentage: number;
    presentDays: number;
    totalDays: number;
  };
  fees: {
    pendingAmount: number;
    unpaidCount: number;
  };
  uniform: {
    issued: boolean;
    status: string;
  };
  course: {
    program: string;
    batch: string;
    branch: string;
  };
  recentAttendance: Array<{
    date: string;
    status: string;
    dayName: string;
  }>;
  profile: {
    name: string;
    studentId: string;
    program: string;
    batch: string;
    branch: string;
  };
}

export default function StudentDashboard() {
  const { student } = useStudentAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      const [profileData, attendanceData, feesData] = await Promise.all([
        studentApi.getProfile(),
        studentApi.getAttendance(),
        studentApi.getFees()
      ]);

      console.log('Profile data:', profileData);
      console.log('Attendance data:', attendanceData);
      console.log('Fees data:', feesData);

      // Calculate attendance percentage
      const totalDays = attendanceData.attendance?.length || 0;
      const presentDays = attendanceData.attendance?.filter((a: any) => a.status === 'present').length || 0;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Calculate pending fees
      const pendingFees = feesData.fees?.filter((f: any) => f.status === 'pending') || [];
      const pendingAmount = pendingFees.reduce((sum: number, fee: any) => sum + parseFloat(fee.amount), 0);

      // Get recent attendance (last 5 records)
      const recentAttendance = (attendanceData.attendance || [])
        .slice(0, 5)
        .map((record: any) => ({
          date: record.date,
          status: record.status,
          dayName: new Date(record.date).toLocaleDateString('en-IN', { weekday: 'long' })
        }));

      setDashboardData({
        attendance: {
          percentage: attendancePercentage,
          presentDays,
          totalDays
        },
        fees: {
          pendingAmount,
          unpaidCount: pendingFees.length
        },
        uniform: {
          issued: profileData.uniform?.issued || false,
          status: profileData.uniform?.issued ? 'Issued' : 'Pending'
        },
        course: {
          program: profileData.program || 'Not assigned',
          batch: profileData.batch || 'Not assigned',
          branch: profileData.branchName || 'Not assigned'
        },
        recentAttendance,
        profile: {
          name: profileData.name,
          studentId: profileData.id,
          program: profileData.program || 'Not assigned',
          batch: profileData.batch || 'Not assigned',
          branch: profileData.branchName || 'Not assigned'
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set empty data to prevent crashes
      setDashboardData({
        attendance: { percentage: 0, presentDays: 0, totalDays: 0 },
        fees: { pendingAmount: 0, unpaidCount: 0 },
        uniform: { issued: false, status: 'Pending' },
        course: { program: 'Not assigned', batch: 'Not assigned', branch: 'Not assigned' },
        recentAttendance: [],
        profile: {
          name: student?.name || 'Student',
          studentId: student?.id || 'N/A',
          program: 'Not assigned',
          batch: 'Not assigned',
          branch: 'Not assigned'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Attendance</CardTitle>
            <Calendar className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {dashboardData.attendance.percentage}%
            </div>
            <Progress value={dashboardData.attendance.percentage} className="mb-2" />
            <p className="text-sm text-gray-600">
              {dashboardData.attendance.presentDays} of {dashboardData.attendance.totalDays} days present
            </p>
          </CardContent>
        </Card>

        {/* Fees Due Card */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fees Due</CardTitle>
            <CreditCard className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <IndianRupee className="h-6 w-6 mr-1" />
              {dashboardData.fees.pendingAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-sm text-gray-600">
              {dashboardData.fees.unpaidCount} invoice(s) outstanding
            </p>
          </CardContent>
        </Card>

        {/* Uniform Status Card */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Uniform Status</CardTitle>
            <Shirt className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {dashboardData.uniform.issued ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-orange-500" />
              )}
              <span className="text-xl font-bold text-gray-900">
                {dashboardData.uniform.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {dashboardData.uniform.issued 
                ? 'Uniform collected' 
                : 'Contact administration for updates'
              }
            </p>
          </CardContent>
        </Card>

        {/* Course Details Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Course Details</CardTitle>
            <BookOpen className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 mb-1">
              {dashboardData.course.program}
            </div>
            <Badge variant="secondary" className="mb-2">
              {dashboardData.course.batch}
            </Badge>
            <p className="text-sm text-gray-600">{dashboardData.course.branch}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance & Student Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attendance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentAttendance.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentAttendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-l-4 border-l-green-500 pl-4 bg-gray-50 rounded-r-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-IN', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{record.dayName}</p>
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
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No attendance records available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {dashboardData.profile.name}
              </h3>
              <p className="text-sm text-gray-600">{dashboardData.profile.program}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Guardian</span>
                <span className="text-sm font-medium">Parent/Guardian Name</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone</span>
                <span className="text-sm font-medium">123-456-7890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Batch</span>
                <span className="text-sm font-medium">{dashboardData.profile.batch}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
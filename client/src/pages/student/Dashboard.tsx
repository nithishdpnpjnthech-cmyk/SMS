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
      ]) as [any, any, any];

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
    <div className="space-y-8 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-card p-4 sm:p-6 rounded-2xl shadow-sm border border-muted/50">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
          <span className="text-2xl sm:text-3xl font-black text-primary font-heading">{dashboardData.profile.name?.[0] || 'S'}</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading text-gray-900 leading-none">Student Portal</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm font-medium text-muted-foreground">
            <p className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-muted/50">
              {dashboardData.profile.name}
            </p>
            <p className="hidden sm:block opacity-30">|</p>
            <p className="flex items-center gap-1.5 opacity-80">
              ID: {dashboardData.profile.studentId}
            </p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 bg-muted/20 p-2 sm:p-3 rounded-xl border border-muted/50 w-fit">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">CURRENT BATCH</p>
            <p className="text-sm font-bold text-gray-900 leading-none">{dashboardData.course.batch}</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-bold">
            ACTIVE
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Attendance Card */}
        <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md hover:border-blue-300 border-l-4 border-l-blue-500 group overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Attendance Status</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-4 pt-2 pb-5">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 font-heading tracking-tight">
              {dashboardData.attendance.percentage}%
            </div>
            <Progress value={dashboardData.attendance.percentage} className="h-2 mb-3 bg-blue-50" />
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-tighter">
              {dashboardData.attendance.presentDays} OF {dashboardData.attendance.totalDays} SESSIONS
            </p>
          </CardContent>
        </Card>

        {/* Fees Due Card */}
        <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md hover:border-orange-300 border-l-4 border-l-orange-500 group overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Pending Dues</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-4 pt-2 pb-5">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 font-heading tracking-tight flex items-center">
              <span className="text-lg mr-1 opacity-50">₹</span>
              {dashboardData.fees.pendingAmount.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 w-fit">
              <AlertCircle className="h-3 w-3 text-orange-600" />
              <p className="text-[10px] font-bold text-orange-700 uppercase">
                {dashboardData.fees.unpaidCount} INVOICES
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Uniform Status Card */}
        <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md hover:border-purple-300 border-l-4 border-l-purple-500 group overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Kits & Gear</CardTitle>
            <Shirt className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-4 pt-2 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xl sm:text-2xl font-black font-heading tracking-tight ${dashboardData.uniform.issued ? 'text-green-600' : 'text-orange-600'}`}>
                {dashboardData.uniform.status.toUpperCase()}
              </span>
            </div>
            <div className={`p-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${dashboardData.uniform.issued ? 'bg-green-50 border-green-100 text-green-700' : 'bg-muted/30 border-muted/50 text-muted-foreground'}`}>
              {dashboardData.uniform.issued ? 'GEAR COLLECTED' : 'CHECK AT RECEPTION'}
            </div>
          </CardContent>
        </Card>

        {/* Course Details Card */}
        <Card className="shadow-sm border-muted/50 transition-all hover:shadow-md hover:border-green-300 border-l-4 border-l-green-500 group overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Course Path</CardTitle>
            <BookOpen className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-4 pt-2 pb-5">
            <div className="text-lg sm:text-xl font-black text-gray-900 mb-1 font-heading leading-tight truncate">
              {dashboardData.course.program}
            </div>
            <p className="text-[10px] font-black text-green-700/70 border border-green-100 bg-green-50 px-2 py-0.5 rounded-full w-fit uppercase tracking-tighter">
              {dashboardData.course.branch}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance & Student Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attendance */}
        <Card className="lg:col-span-2 shadow-sm border-muted/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-muted/50 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-heading">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shadow-sm">
                <Clock className="h-5 w-5" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dashboardData.recentAttendance.length > 0 ? (
              <div className="divide-y divide-muted/50">
                {dashboardData.recentAttendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-muted/10 transition-colors group">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {new Date(record.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{record.dayName}</p>
                    </div>
                    <Badge
                      variant={record.status === 'present' ? 'default' : 'destructive'}
                      className={`px-3 py-1 font-black ${record.status === 'present' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-none' : 'shadow-sm'}`}
                    >
                      {record.status === 'present' ? 'PRESENT' : 'ABSENT'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 px-6">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50 shadow-inner">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Class sessions will appear here once recorded by trainers.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Profile Summary */}
        <Card className="shadow-lg border-primary/10 overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
          <CardHeader className="border-b border-muted/50 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <div className="p-2 bg-white rounded-lg text-primary shadow-sm border border-primary/10">
                <User className="h-5 w-5" />
              </div>
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-8 border-b border-dashed border-muted-foreground/20 pb-6 relative">
              <div className="bg-white p-1 rounded-full w-24 h-24 mx-auto mb-4 shadow-xl border-4 border-primary/10 relative z-10">
                <div className="bg-primary/5 rounded-full w-full h-full flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1 font-heading tracking-tight leading-none">
                {dashboardData.profile.name}
              </h3>
              <p className="text-xs font-black text-primary/70 uppercase tracking-widest mt-2">{dashboardData.profile.program.toUpperCase()}</p>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">REGISTRATION ID</span>
                <span className="text-sm font-bold text-gray-800 bg-white px-3 py-2 rounded-xl border border-muted/50 shadow-sm">{dashboardData.profile.studentId}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">PRIMARY CONTACT</span>
                <span className="text-sm font-bold text-gray-800 bg-white px-3 py-2 rounded-xl border border-muted/50 shadow-sm">Verified Profile</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">ASSIGNED BRANCH</span>
                <span className="text-sm font-bold text-gray-800 bg-white px-3 py-2 rounded-xl border border-muted/50 shadow-sm">{dashboardData.profile.branch}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  CreditCard, 
  Shirt, 
  FileText, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useStudentAuth } from '@/lib/student-auth';
import { useAcademyBranding } from '@/hooks/use-academy-branding';
import { updatePageTitle } from '@/lib/page-title';
import { cn } from '@/lib/utils';
import StudentDashboard from './Dashboard';
import StudentProfilePage from './Profile';
import StudentAttendance from './Attendance';
import StudentFees from './Fees';
import StudentUniform from './Uniform';
import StudentNotes from './Notes';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
  { icon: User, label: 'My Profile', path: '/student/profile' },
  { icon: Calendar, label: 'Attendance', path: '/student/attendance' },
  { icon: CreditCard, label: 'Fees & Payments', path: '/student/fees' },
  { icon: Shirt, label: 'Uniform', path: '/student/uniform' },
  { icon: FileText, label: 'Notes', path: '/student/notes' },
];

export default function StudentLayout() {
  const { student, logout } = useStudentAuth();
  const { branding, getPortalName } = useAcademyBranding();
  const [location, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());

  console.log('StudentLayout - Current location:', location);
  console.log('StudentLayout - Student data:', student);

  // Update page title based on current route and academy branding
  useEffect(() => {
    const getPageName = () => {
      if (location === '/student/profile') return 'My Profile';
      if (location === '/student/attendance') return 'Attendance';
      if (location === '/student/fees') return 'Fees & Payments';
      if (location === '/student/uniform') return 'Uniform';
      if (location === '/student/notes') return 'Notes';
      return 'Dashboard';
    };
    
    updatePageTitle(branding.academyName, getPageName());
  }, [location, branding.academyName]);

  const handleLogout = () => {
    updatePageTitle(null, 'Login');
    logout();
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Redirect to dashboard if on base student path
    if (location === '/student' || location === '/student/') {
      console.log('Redirecting to dashboard from:', location);
      setLocation('/student/dashboard');
    }
  }, [location, setLocation]);

  const getStudentInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderContent = () => {
    if (location === '/student/profile') return <StudentProfilePage />;
    if (location === '/student/attendance') return <StudentAttendance />;
    if (location === '/student/fees') return <StudentFees />;
    if (location === '/student/uniform') return <StudentUniform />;
    if (location === '/student/notes') return <StudentNotes />;
    return <StudentDashboard />; // Default for dashboard and fallback
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo & Academy Name */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">{getPortalName()}</h1>
              <p className="text-sm text-gray-600">Student Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <li key={item.path}>
                  <button
                    onClick={() => setLocation(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {student?.name ? getStudentInitials(student.name) : 'ST'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {student?.name || 'Student'}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {student?.email || 'student@academy.edu'}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {student?.name?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your academic life today.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{formatDate(currentDate)}</p>
              <Button variant="outline" onClick={handleLogout} className="mt-2">
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
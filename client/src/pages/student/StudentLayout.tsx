import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  User,
  Calendar,
  CreditCard,
  Shirt,
  FileText,
  LogOut,
  GraduationCap,
  Menu
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col bg-white border-r border-muted/50">
      {/* Logo & Academy Name */}
      <div className="p-6 border-b border-muted/50 bg-gradient-to-br from-blue-50/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95 duration-200 cursor-pointer">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-lg text-gray-900 truncate font-heading leading-tight">{getPortalName()}</h1>
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-0.5">Student Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <div key={item.path}>
              <button
                onClick={() => {
                  setLocation(item.path);
                  onNavigate?.();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group relative",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "text-gray-600 hover:bg-muted/50 hover:text-gray-900"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors duration-300",
                  isActive ? "bg-white/20" : "bg-muted/50 text-muted-foreground group-hover:bg-white group-hover:text-primary group-hover:shadow-sm"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]"></div>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-muted/50 bg-muted/20">
        <div className="flex items-center gap-3 mb-4 p-2 bg-white rounded-2xl border border-muted/50 shadow-sm">
          <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm">
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">
              {student?.name ? getStudentInitials(student.name) : 'ST'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-black text-xs text-gray-900 truncate uppercase tracking-tight">
              {student?.name || 'Student'}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground truncate uppercase">
              Active Enrollment
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => { handleLogout(); onNavigate?.(); }}
          className="w-full flex items-center justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold px-4 py-3 rounded-xl transition-all duration-200 group"
        >
          <div className="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
            <LogOut className="h-4 w-4" />
          </div>
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 shadow-lg flex-col flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-muted/50 px-4 sm:px-6 lg:px-8 h-[72px] sm:h-[88px] flex items-center shadow-sm">
          <div className="flex justify-between items-center gap-4 w-full">
            <div className="flex items-center gap-4 min-w-0">
              {/* Mobile hamburger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 border border-muted/50 bg-white shadow-sm flex-shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80 border-none shadow-2xl">
                  <SidebarContent onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-black text-gray-900 truncate font-heading tracking-tight leading-none group cursor-default">
                  <span className="text-primary/40 mr-1 sm:mr-2">#</span>
                  Hello, {student?.name?.split(' ')[0] || 'Student'}
                  <span className="hidden sm:inline animate-pulse ml-1 text-primary">👋</span>
                </h1>
                <p className="text-muted-foreground mt-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest hidden sm:block opacity-60">
                  Today is {formatDate(currentDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end mr-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">ACADEMIC STATUS</p>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 font-bold py-0.5 shadow-sm">Verfied Enrolled</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 border-muted/50 font-bold hover:bg-muted/10 transition-all active:scale-95"
              >
                <LogOut className="h-4 w-4 opacity-70" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-0 py-4 sm:p-6 lg:p-10">
          <div className="max-w-[1600px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
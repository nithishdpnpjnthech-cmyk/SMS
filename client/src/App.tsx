import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { StudentAuthProvider } from "@/lib/student-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/dashboard/Dashboard";
import TrainerDashboard from "@/pages/dashboard/TrainerDashboard";
import ManagerDashboard from "@/pages/dashboard/ManagerDashboard";
import ReceptionistDashboard from "@/pages/dashboard/ReceptionistDashboard";
import StudentList from "@/pages/students/StudentList";
import StudentProfile from "@/pages/students/StudentProfile";
import AddStudent from "@/pages/students/AddStudent";
import EditStudent from "@/pages/students/EditStudent";
import AttendanceDashboard from "@/pages/attendance/AttendanceDashboard";
import MarkAttendance from "@/pages/attendance/MarkAttendance";
import FeesDashboard from "@/pages/fees/FeesDashboard";
import CollectFees from "@/pages/fees/CollectFees";
import TrainerList from "@/pages/trainers/TrainerList";
import MasterData from "@/pages/admin/MasterData";
import BranchManagement from "@/pages/branches/BranchManagement";
import BranchDetail from "@/pages/branches/BranchDetail";
import ReportsDashboard from "@/pages/reports/ReportsDashboard";
import Profile from "@/pages/profile/Profile";
import Settings from "@/pages/settings/Settings";
import ProtectedRoute from "@/components/ProtectedRoute";
import StudentLoginPage from "@/pages/student/StudentLoginPage";
import StudentLayout from "@/pages/student/StudentLayout";
import StudentDashboard from "@/pages/student/Dashboard";
import StudentProfilePage from "@/pages/student/Profile";
import StudentAttendance from "@/pages/student/Attendance";
import StudentFees from "@/pages/student/Fees";
import StudentUniform from "@/pages/student/Uniform";
import StudentNotes from "@/pages/student/Notes";
import StudentProtectedRoute from "@/components/StudentProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      {/* Student Portal Routes */}
      <Route path="/student/login" component={StudentLoginPage} />
      <StudentProtectedRoute path="/student/:page?" component={StudentLayout} />
      
      {/* Protected Routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} requiredRole="admin" />
      <ProtectedRoute path="/dashboard/manager" component={ManagerDashboard} requiredRole="manager" />
      <ProtectedRoute path="/dashboard/receptionist" component={ReceptionistDashboard} requiredRole="receptionist" />
      <ProtectedRoute path="/dashboard/trainer" component={TrainerDashboard} requiredRole="trainer" />
      
      <ProtectedRoute path="/students" component={StudentList} allowedRoles={["admin", "manager", "receptionist", "trainer"]} />
      <ProtectedRoute path="/students/add" component={AddStudent} allowedRoles={["admin", "receptionist"]} />
      <ProtectedRoute path="/students/:id/edit" component={EditStudent} allowedRoles={["admin", "receptionist"]} />
      <ProtectedRoute path="/students/:id" component={StudentProfile} allowedRoles={["admin", "manager", "receptionist", "trainer"]} />
      
      <ProtectedRoute path="/attendance" component={AttendanceDashboard} allowedRoles={["admin", "manager", "trainer"]} />
      <ProtectedRoute path="/attendance/mark" component={MarkAttendance} allowedRoles={["admin", "trainer"]} />
      
      <ProtectedRoute path="/fees" component={FeesDashboard} allowedRoles={["admin", "manager", "receptionist"]} />
      <ProtectedRoute path="/fees/collect" component={CollectFees} allowedRoles={["admin", "receptionist"]} />
      
      <ProtectedRoute path="/trainers" component={TrainerList} allowedRoles={["admin", "manager"]} />
      <ProtectedRoute path="/admin/master-data" component={MasterData} allowedRoles={["admin"]} />
      <ProtectedRoute path="/branches" component={BranchManagement} allowedRoles={["admin"]} />
      <ProtectedRoute path="/branches/:id/manage" component={BranchDetail} allowedRoles={["admin"]} />
      <ProtectedRoute path="/reports" component={ReportsDashboard} allowedRoles={["admin", "manager"]} />
      
      <ProtectedRoute path="/profile" component={Profile} allowedRoles={["admin", "manager", "receptionist", "trainer"]} />
      <ProtectedRoute path="/settings" component={Settings} allowedRoles={["admin", "manager", "receptionist", "trainer"]} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StudentAuthProvider>
          <AppProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AppProvider>
        </StudentAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

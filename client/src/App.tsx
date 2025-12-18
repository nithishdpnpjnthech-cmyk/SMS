import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/dashboard/Dashboard";
import TrainerDashboard from "@/pages/dashboard/TrainerDashboard";
import ManagerDashboard from "@/pages/dashboard/ManagerDashboard";
import ReceptionistDashboard from "@/pages/dashboard/ReceptionistDashboard";
import StudentList from "@/pages/students/StudentList";
import StudentProfile from "@/pages/students/StudentProfile";
import AddStudent from "@/pages/students/AddStudent";
import AttendanceDashboard from "@/pages/attendance/AttendanceDashboard";
import QRScanner from "@/pages/attendance/QRScanner";
import FeesDashboard from "@/pages/fees/FeesDashboard";
import CollectFees from "@/pages/fees/CollectFees";
import TrainerList from "@/pages/trainers/TrainerList";
import BranchList from "@/pages/branches/BranchList";
import ReportsDashboard from "@/pages/reports/ReportsDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      {/* Role-Based Dashboards */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/receptionist" component={ReceptionistDashboard} />
      <Route path="/trainer" component={TrainerDashboard} />
      
      {/* Legacy routes for backward compatibility */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/manager" component={ManagerDashboard} />
      <Route path="/dashboard/receptionist" component={ReceptionistDashboard} />
      <Route path="/dashboard/trainer" component={TrainerDashboard} />
      
      {/* Student Module */}
      <Route path="/students" component={StudentList} />
      <Route path="/students/add" component={AddStudent} />
      <Route path="/students/:id" component={StudentProfile} />
      
      {/* Attendance Module */}
      <Route path="/attendance" component={AttendanceDashboard} />
      <Route path="/attendance/qr" component={QRScanner} />
      
      {/* Fees Module */}
      <Route path="/fees" component={FeesDashboard} />
      <Route path="/fees/collect" component={CollectFees} />
      
      {/* Other Modules */}
      <Route path="/trainers" component={TrainerList} />
      <Route path="/branches" component={BranchList} />
      <Route path="/reports" component={ReportsDashboard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;

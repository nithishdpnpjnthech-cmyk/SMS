import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/dashboard/Dashboard";
import StudentList from "@/pages/students/StudentList";
import StudentProfile from "@/pages/students/StudentProfile";
import AttendanceDashboard from "@/pages/attendance/AttendanceDashboard";
import FeesDashboard from "@/pages/fees/FeesDashboard";
import TrainerList from "@/pages/trainers/TrainerList";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/students" component={StudentList} />
      <Route path="/students/:id" component={StudentProfile} />
      <Route path="/attendance" component={AttendanceDashboard} />
      <Route path="/fees" component={FeesDashboard} />
      <Route path="/trainers" component={TrainerList} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

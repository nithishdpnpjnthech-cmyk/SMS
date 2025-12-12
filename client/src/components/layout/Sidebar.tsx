import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  CreditCard, 
  GraduationCap, 
  Building2, 
  FileBarChart, 
  LogOut,
  Menu,
  Clock,
  User
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Define role-based navigation items
const NAV_CONFIG = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Students", icon: Users, href: "/students" },
    { label: "Attendance", icon: CalendarCheck, href: "/attendance" },
    { label: "Fees & Billing", icon: CreditCard, href: "/fees" },
    { label: "Trainers", icon: GraduationCap, href: "/trainers" },
    { label: "Branches", icon: Building2, href: "/branches" },
    { label: "Reports", icon: FileBarChart, href: "/reports" },
  ],
  manager: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/manager" },
    { label: "Students", icon: Users, href: "/students" },
    { label: "Attendance", icon: CalendarCheck, href: "/attendance" },
    { label: "Fees & Billing", icon: CreditCard, href: "/fees" },
    { label: "Trainers", icon: GraduationCap, href: "/trainers" },
    { label: "Reports", icon: FileBarChart, href: "/reports" },
  ],
  receptionist: [
    { label: "Front Desk", icon: LayoutDashboard, href: "/dashboard/receptionist" },
    { label: "Students", icon: Users, href: "/students" },
    { label: "Attendance", icon: CalendarCheck, href: "/attendance" },
    { label: "Fees", icon: CreditCard, href: "/fees" },
  ],
  trainer: [
    { label: "My Schedule", icon: LayoutDashboard, href: "/dashboard/trainer" },
    { label: "My Students", icon: Users, href: "/students" }, // Could be filtered view
  ],
  parent: [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard/parent" },
    { label: "Schedule", icon: Clock, href: "/dashboard/parent/schedule" }, // Placeholder
    { label: "Payments", icon: CreditCard, href: "/fees" },
  ]
};

export function Sidebar() {
  const [location] = useLocation();
  const [role, setRole] = useState("admin");

  useEffect(() => {
    // In a real app, this comes from context/auth
    const storedRole = localStorage.getItem("userRole") || "admin";
    setRole(storedRole);
  }, []);

  // @ts-ignore
  const navItems = NAV_CONFIG[role] || NAV_CONFIG.admin;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 font-heading font-bold text-xl text-sidebar-primary-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            A
          </div>
          AcademyMaster
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-3">
        <div className="mb-4 px-3">
          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            {role.replace('_', ' ')} Portal
          </p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item: any) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-sidebar-border/50 p-4">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const [role, setRole] = useState("admin");

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") || "admin";
    setRole(storedRole);
  }, []);

  // @ts-ignore
  const navItems = NAV_CONFIG[role] || NAV_CONFIG.admin;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-sidebar text-sidebar-foreground w-72 border-r-sidebar-border">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6 border-b border-sidebar-border/50">
            <div className="flex items-center gap-2 font-heading font-bold text-xl text-sidebar-primary-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                A
              </div>
              AcademyMaster
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-6 px-3">
            <div className="mb-4 px-3">
              <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                {role} Portal
              </p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item: any) => {
                 const isActive = location === item.href || location.startsWith(item.href + "/");
                 return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                    <a
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                      {item.label}
                    </a>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="border-t border-sidebar-border/50 p-4">
            <Link href="/" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

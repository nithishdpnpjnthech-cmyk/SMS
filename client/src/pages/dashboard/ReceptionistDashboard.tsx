import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, CreditCard, CalendarCheck, Search, Bell, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export default function ReceptionistDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Front Desk</h1>
            <p className="text-muted-foreground">Welcome back, Sarah. Ready for today's check-ins?</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">3</span>
            </Button>
            <div className="text-sm font-medium text-right hidden md:block">
              <p>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
              <p className="text-muted-foreground">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium">Quick Student Lookup</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name, ID, or phone number..." className="pl-10 bg-white" />
                </div>
              </div>
              <Button size="lg" className="w-full md:w-auto">Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/attendance/qr">
            <Card className="hover:border-primary/50 cursor-pointer transition-colors hover:bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">QR Check-in</h3>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/students/add">
            <Card className="hover:border-primary/50 cursor-pointer transition-colors hover:bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <UserPlus className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">New Admission</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/fees/collect">
            <Card className="hover:border-primary/50 cursor-pointer transition-colors hover:bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">Collect Fee</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/students">
            <Card className="hover:border-primary/50 cursor-pointer transition-colors hover:bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">All Students</h3>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Classes</CardTitle>
              <CardDescription>Ongoing and upcoming sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: "05:00 PM", class: "Karate - Kids", status: "Ongoing", color: "text-green-600 bg-green-100" },
                  { time: "06:00 PM", class: "Yoga - Evening", status: "Upcoming", color: "text-blue-600 bg-blue-100" },
                  { time: "07:00 PM", class: "Dance - Advanced", status: "Upcoming", color: "text-blue-600 bg-blue-100" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.class}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={item.color}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="h-2 w-2 mt-2 rounded-full bg-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Payment Overdue: John Doe</p>
                    <p className="text-xs text-muted-foreground">Parent promised to pay by evening.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">New Enquiry: Dance Class</p>
                    <p className="text-xs text-muted-foreground">Walk-in enquiry for 7yr old.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

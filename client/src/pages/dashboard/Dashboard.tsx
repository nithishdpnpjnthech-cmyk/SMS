import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STATS, TODAY_CLASSES } from "@/lib/mockData";
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  Clock,
  MapPin,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const chartData = [
  { name: "Mon", attendance: 85, revenue: 1200 },
  { name: "Tue", attendance: 88, revenue: 900 },
  { name: "Wed", attendance: 92, revenue: 1600 },
  { name: "Thu", attendance: 90, revenue: 1100 },
  { name: "Fri", attendance: 95, revenue: 2100 },
  { name: "Sat", attendance: 85, revenue: 800 },
  { name: "Sun", attendance: 0, revenue: 0 },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Dashboard</h1>
            <p className="text-muted-foreground">Overview of today's academy operations.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">Download Report</Button>
            <Button>Add Student</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-elevate transition-all border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{STATS.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                +4 from last month
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{STATS.presentToday} / {STATS.presentToday + STATS.absentToday}</div>
              <p className="text-xs text-muted-foreground">
                90% Present today
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${STATS.feesCollectedToday}</div>
              <p className="text-xs text-muted-foreground">
                Today's revenue
              </p>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">${STATS.pendingDues}</div>
              <p className="text-xs text-muted-foreground">
                Across 15 students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Today's Schedule */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
              <CardDescription>Attendance and revenue trends for the current week.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs text-muted-foreground" />
                    <YAxis yAxisId="left" className="text-xs text-muted-foreground" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                    <Area yAxisId="right" type="monotone" dataKey="attendance" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorAttendance)" name="Attendance (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Today's Classes</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TODAY_CLASSES.map((session) => (
                  <div key={session.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{session.program} - {session.batch}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>Main Hall</span>
                          <span>•</span>
                          <span>{session.time}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={session.status === 'completed' ? 'secondary' : 'default'} className={session.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : ''}>
                      {session.status}
                    </Badge>
                  </div>
                ))}
                
                <Button variant="ghost" className="w-full text-xs text-muted-foreground">
                  View Full Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 {[1,2,3].map((i) => (
                   <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                     <div className="flex items-center gap-4">
                       <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                         ST
                       </div>
                       <div>
                         <p className="text-sm font-medium">Student Name {i}</p>
                         <p className="text-xs text-muted-foreground">Checked in at 05:45 PM</p>
                       </div>
                     </div>
                     <Badge variant="outline" className="text-xs">On Time</Badge>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors">
                <Users className="h-5 w-5" />
                <span className="text-xs">Add Student</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors">
                <CreditCard className="h-5 w-5" />
                <span className="text-xs">Collect Fee</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors">
                <CalendarCheck className="h-5 w-5" />
                <span className="text-xs">Attendance</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors">
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">Reports</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";

const monthlyRevenue = [
  { name: "Jan", total: 4500 },
  { name: "Feb", total: 5200 },
  { name: "Mar", total: 4800 },
  { name: "Apr", total: 6100 },
  { name: "May", total: 5900 },
  { name: "Jun", total: 7200 },
];

const studentGrowth = [
  { name: "Jan", students: 100 },
  { name: "Feb", students: 105 },
  { name: "Mar", students: 112 },
  { name: "Apr", students: 118 },
  { name: "May", students: 124 },
];

const programDistribution = [
  { name: "Karate", value: 45 },
  { name: "Yoga", value: 30 },
  { name: "Dance", value: 25 },
  { name: "Arts", value: 20 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ReportsDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Analytics & Reports</h1>
        <p className="text-muted-foreground">Deep dive into your academy's performance metrics.</p>

        <Tabs defaultValue="financial" className="w-full">
          <TabsList>
            <TabsTrigger value="financial">Financial Reports</TabsTrigger>
            <TabsTrigger value="attendance">Attendance & Growth</TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                  <CardDescription>Income trend over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs text-muted-foreground" />
                      <YAxis className="text-xs text-muted-foreground" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Fee Collection Status</CardTitle>
                  <CardDescription>Paid vs Pending for current month</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                     {/* Placeholder for Pie Chart if needed, or simple stats */}
                     <div className="flex gap-8 justify-center items-end h-full pb-8">
                        <div className="text-center">
                          <div className="h-40 w-16 bg-green-500 rounded-t-lg mx-auto"></div>
                          <p className="mt-2 font-bold">Paid</p>
                          <p className="text-sm text-muted-foreground">85%</p>
                        </div>
                        <div className="text-center">
                          <div className="h-10 w-16 bg-orange-500 rounded-t-lg mx-auto"></div>
                          <p className="mt-2 font-bold">Pending</p>
                          <p className="text-sm text-muted-foreground">15%</p>
                        </div>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Student Growth</CardTitle>
                  <CardDescription>Total active enrollments</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentGrowth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs text-muted-foreground" />
                      <YAxis className="text-xs text-muted-foreground" domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Program Popularity</CardTitle>
                  <CardDescription>Distribution of students by program</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={programDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {programDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

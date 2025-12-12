import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, CheckCircle } from "lucide-react";

export default function TrainerDashboard() {
  const schedule = [
    { time: "06:00 AM", class: "Yoga - Morning Batch", location: "Hall A", students: 15, status: "Completed" },
    { time: "05:00 PM", class: "Karate - Kids Batch", location: "Dojo 1", students: 22, status: "Upcoming" },
    { time: "06:00 PM", class: "Karate - Advanced", location: "Dojo 1", students: 12, status: "Upcoming" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Trainer Portal</h1>
        <p className="text-muted-foreground">Welcome back, Sensei Kenji.</p>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg opacity-90">Today's Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">3</div>
              <p className="text-sm opacity-80 mt-1">1 Completed, 2 Remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">49</div>
              <p className="text-sm text-muted-foreground mt-1">Across 3 batches</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-500">4.9</div>
              <p className="text-sm text-muted-foreground mt-1">From 124 reviews</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                      <span>{item.time.split(' ')[0]}</span>
                      <span className="text-xs font-normal">{item.time.split(' ')[1]}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{item.class}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {item.students} Students</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center gap-3">
                    <Badge variant={item.status === 'Completed' ? 'secondary' : 'default'} className={item.status === 'Completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                      {item.status}
                    </Badge>
                    {item.status === 'Upcoming' && (
                      <Button size="sm">Start Class</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

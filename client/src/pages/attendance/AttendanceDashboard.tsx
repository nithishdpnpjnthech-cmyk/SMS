import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PROGRAMS, BATCHES } from "@/lib/mockData";
import { CalendarCheck, Check, X, Clock, User, Filter } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AttendanceDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Mock data for class list
  const studentsInClass = [
    { id: 1, name: "Alex Johnson", status: "present" },
    { id: 2, name: "Mia Williams", status: "present" },
    { id: 3, name: "Ethan Brown", status: "absent" },
    { id: 4, name: "Sophia Davis", status: "present" },
    { id: 5, name: "Lucas Miller", status: "present" },
    { id: 6, name: "Olivia Wilson", status: "late" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Attendance</h1>
            <p className="text-muted-foreground">Track and manage daily class attendance.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            Download Report
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Calendar Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow-sm w-full"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Summary for Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Present</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">92%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Absent</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">5%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Late</span>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">3%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Attendance Area */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Class Attendance</CardTitle>
                    <CardDescription>Mark attendance for specific batches.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue={PROGRAMS[0]}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Program" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select defaultValue={BATCHES[0]}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {BATCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {studentsInClass.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 border border-transparent hover:border-border transition-all">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-muted-foreground">ID: ST-00{student.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant={student.status === 'present' ? 'default' : 'outline'}
                          className={student.status === 'present' ? 'bg-green-600 hover:bg-green-700' : 'text-muted-foreground'}
                        >
                          <Check className="h-4 w-4 mr-1" /> Present
                        </Button>
                        <Button 
                          size="sm" 
                          variant={student.status === 'absent' ? 'destructive' : 'outline'}
                          className={student.status === 'absent' ? '' : 'text-muted-foreground'}
                        >
                          <X className="h-4 w-4 mr-1" /> Absent
                        </Button>
                        <Button 
                          size="sm" 
                          variant={student.status === 'late' ? 'secondary' : 'outline'}
                          className={student.status === 'late' ? 'bg-orange-100 text-orange-800' : 'text-muted-foreground'}
                        >
                          <Clock className="h-4 w-4 mr-1" /> Late
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline">Reset</Button>
                  <Button>Save Attendance</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <div className="h-4 w-4" >QR</div> 
                    </div>
                    <CardTitle className="text-base">QR Mode</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enable QR code scanning for touchless student check-in at the front desk.
                  </p>
                  <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">Launch Scanner</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

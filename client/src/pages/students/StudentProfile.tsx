import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen, Clock, FileText, Download } from "lucide-react";
import { Link, useRoute } from "wouter";
import { STUDENTS } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudentProfile() {
  const [, params] = useRoute("/students/:id");
  const studentId = params?.id || "ST-001"; // Fallback for dev/mock
  const student = STUDENTS.find(s => s.id === studentId) || STUDENTS[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link href="/students">
          <Button variant="ghost" className="pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Student List
          </Button>
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Card className="w-full md:w-80 shrink-0">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-32 w-32 border-4 border-muted mb-4">
                <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                  {student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold font-heading">{student.name}</h2>
              <p className="text-sm text-muted-foreground mb-2">ID: {student.id}</p>
              <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="mb-6">
                {student.status.toUpperCase()}
              </Badge>

              <div className="w-full space-y-4 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">student@example.com</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>123 Main St, Cityville</span>
                </div>
              </div>
              
              <div className="w-full mt-6 flex gap-2">
                <Button className="flex-1" variant="outline">Message</Button>
                <Button className="flex-1">Edit</Button>
              </div>
            </CardContent>
          </Card>

          {/* Details Tabs */}
          <div className="flex-1 w-full">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="attendance" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
                >
                  Attendance History
                </TabsTrigger>
                <TabsTrigger 
                  value="fees" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
                >
                  Fees & Invoices
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Program Enrolled</p>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{student.program}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Current Batch</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{student.batch}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{student.joinDate}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Parent/Guardian</p>
                      <span className="font-semibold">{student.parentName}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-l-2 border-primary pl-4 py-1">
                        <p className="text-sm font-medium">Belt Exam Passed</p>
                        <p className="text-xs text-muted-foreground mb-1">May 15, 2025</p>
                        <p className="text-sm">Successfully passed the yellow belt examination with distinction.</p>
                      </div>
                      <div className="border-l-2 border-muted pl-4 py-1">
                        <p className="text-sm font-medium">Uniform Issued</p>
                        <p className="text-xs text-muted-foreground mb-1">Jan 20, 2025</p>
                        <p className="text-sm">Standard size M uniform kit issued.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attendance" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      Attendance calendar view would go here.
                      <br />
                      Current Attendance: <span className="font-bold text-foreground">{student.attendance}%</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fees" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Payment History</CardTitle>
                      <Button size="sm">Create Invoice</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex items-center justify-between border p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Tuition Fee - May</p>
                              <p className="text-xs text-muted-foreground">Paid on May 0{i}, 2025</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold">$150.00</span>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

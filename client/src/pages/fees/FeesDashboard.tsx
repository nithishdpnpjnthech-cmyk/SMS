import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RECENT_FEES, STATS } from "@/lib/mockData";
import { DollarSign, Download, Filter, Search, CreditCard, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FeesDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Fees & Billing</h1>
            <p className="text-muted-foreground">Manage invoices, payments, and financial reports.</p>
          </div>
          <Button className="gap-2 shadow-md bg-green-600 hover:bg-green-700 text-white">
            <DollarSign className="h-4 w-4" />
            Collect New Payment
          </Button>
        </div>

        {/* Financial Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected (This Month)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,450</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">${STATS.pendingDues}</div>
              <p className="text-xs text-muted-foreground">15 invoices pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">$450</div>
              <p className="text-xs text-muted-foreground">3 invoices overdue &gt; 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="w-full">
          <TabsList>
            <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
            <TabsTrigger value="dues">Pending Dues</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoice or student..." className="pl-9" />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {RECENT_FEES.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                        <TableCell className="font-medium">{invoice.student}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>${invoice.amount}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}
                            className={invoice.status === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {[1, 2, 3].map((i) => (
                      <TableRow key={i}>
                         <TableCell className="font-mono text-xs">INV-00{i+3}</TableCell>
                         <TableCell className="font-medium">Student Name {i}</TableCell>
                         <TableCell>2024-05-0{i}</TableCell>
                         <TableCell>$150</TableCell>
                         <TableCell>
                           <Badge variant="outline" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                             paid
                           </Badge>
                         </TableCell>
                         <TableCell className="text-right">
                           <Button variant="ghost" size="sm">
                             <Download className="h-4 w-4 text-muted-foreground" />
                           </Button>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dues">
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Showing pending dues list...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

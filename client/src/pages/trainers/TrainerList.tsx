import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TRAINERS } from "@/lib/mockData";
import { Search, Plus, Phone, Mail, Star, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TrainerList() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-heading">Trainers</h1>
            <p className="text-muted-foreground">Manage teaching staff and their schedules.</p>
          </div>
          <Button className="gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Add New Trainer
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search trainers..." className="pl-9" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TRAINERS.map((trainer) => (
            <Card key={trainer.id} className="overflow-hidden hover-elevate transition-all group">
              <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/5"></div>
              <CardHeader className="relative pt-0 pb-4">
                <div className="absolute -top-12 left-6">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-sm">
                    <AvatarImage src={trainer.avatar} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {trainer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex justify-end pt-4">
                  <Badge variant={trainer.status === 'active' ? 'default' : 'secondary'} className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                    {trainer.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold font-heading">{trainer.name}</h3>
                  <p className="text-sm text-muted-foreground font-medium text-primary">{trainer.specialty} Instructor</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {trainer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {trainer.email}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-orange-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-medium text-foreground">{trainer.rating}</span>
                  <span className="text-muted-foreground text-xs">(124 reviews)</span>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t p-4 flex gap-2">
                <Button variant="outline" className="flex-1">View Schedule</Button>
                <Button variant="ghost" size="icon">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {/* Add New Card Placeholder */}
          <button className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/10 hover:bg-muted/20 hover:border-primary/50 transition-all group">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-lg">Add Trainer</h3>
              <p className="text-sm text-muted-foreground">Register new staff member</p>
            </div>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

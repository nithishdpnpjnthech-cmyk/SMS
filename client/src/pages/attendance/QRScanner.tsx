import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { QrCode, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState<{name: string, time: string, status: string} | null>(null);
  const { toast } = useToast();

  // Simulate scanning process
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(() => {
        // Randomly "scan" a student every 5 seconds for demo
        const random = Math.random();
        if (random > 0.7) {
          const student = "Alex Johnson";
          const time = new Date().toLocaleTimeString();
          setLastScanned({ name: student, time, status: "Present" });
          toast({
            title: "Check-in Successful",
            description: `${student} marked present at ${time}`,
            variant: "default",
            className: "bg-green-600 text-white border-none"
          });
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isScanning, toast]);

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight font-heading">QR Attendance</h1>
        <p className="text-muted-foreground">Scan student ID card to mark attendance.</p>

        <Card className="border-2 border-primary/20 overflow-hidden relative">
          <CardContent className="p-0 bg-black aspect-square flex items-center justify-center relative">
            {/* Camera View Simulation */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 z-10"></div>
            
            {/* Scanning Animation Line */}
            <div className="absolute w-full h-1 bg-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.8)] z-20 animate-[scan_2s_ease-in-out_infinite] top-0"></div>
            
            <div className="text-white/50 z-0 flex flex-col items-center gap-2">
              <QrCode className="h-32 w-32 opacity-20" />
              <p className="text-sm">Camera Active</p>
            </div>

            {/* Corner Markers */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white/50 rounded-tl-xl z-20"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white/50 rounded-tr-xl z-20"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white/50 rounded-bl-xl z-20"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white/50 rounded-br-xl z-20"></div>
          </CardContent>
        </Card>

        {lastScanned && (
          <Card className="bg-green-50 border-green-200 animate-in fade-in slide-in-from-bottom-2">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-green-800">{lastScanned.name}</p>
                <p className="text-xs text-green-600">Checked in at {lastScanned.time}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-4">
          <Button variant={isScanning ? "destructive" : "default"} onClick={() => setIsScanning(!isScanning)}>
            {isScanning ? "Stop Scanning" : "Start Scanning"}
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

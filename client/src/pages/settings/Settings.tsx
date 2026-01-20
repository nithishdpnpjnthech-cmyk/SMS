import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Shield, Palette, Globe, Database, Download, Building } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [academyName, setAcademyName] = useState('');
  const [isLoadingAcademy, setIsLoadingAcademy] = useState(false);
  const { toast } = useToast();

  // Load academy settings on component mount
  useEffect(() => {
    loadAcademySettings();
  }, []);

  const loadAcademySettings = async () => {
    try {
      const response = await fetch('/api/settings/academy');
      if (response.ok) {
        const data = await response.json();
        setAcademyName(data.academyName || '');
      }
    } catch (error) {
      console.error('Failed to load academy settings:', error);
    }
  };

  const handleSaveAcademyName = async () => {
    if (!academyName.trim()) {
      toast({
        title: "Error",
        description: "Academy name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingAcademy(true);
    try {
      const response = await fetch('/api/settings/academy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
          'x-user-role': localStorage.getItem('userRole') || '',
          'x-user-id': localStorage.getItem('userId') || ''
        },
        body: JSON.stringify({ academyName: academyName.trim() })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Academy name updated successfully"
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update academy name');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update academy name",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAcademy(false);
    }
  };

  // Fix: Add proper handlers for settings buttons
  const handleSaveSettings = () => {
    try {
      // TODO: Implement settings save API call
      localStorage.setItem('settings', JSON.stringify({
        notifications,
        emailAlerts,
        darkMode,
        savedAt: new Date().toISOString()
      }));
      
      toast({
        title: "Success",
        description: "Settings saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    }
  };

  const handleExportData = () => {
    try {
      const settingsData = {
        notifications,
        emailAlerts,
        darkMode,
        exportDate: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(settingsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Settings exported successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export settings",
        variant: "destructive"
      });
    }
  };

  const handleBackupSettings = () => {
    try {
      const backup = {
        settings: { notifications, emailAlerts, darkMode },
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      localStorage.setItem('settingsBackup', JSON.stringify(backup));
      
      toast({
        title: "Success",
        description: "Settings backed up successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to backup settings",
        variant: "destructive"
      });
    }
  };

  const handleClearCache = () => {
    try {
      // Clear relevant cache items
      const keysToKeep = ['user', 'userRole', 'settings', 'settingsBackup'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      toast({
        title: "Success",
        description: "Cache cleared successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences and system settings.</p>
        </div>

        <div className="grid gap-6">
          {/* Academy Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Academy Branding
              </CardTitle>
              <CardDescription>Configure academy name and branding for student portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="academyName">Academy Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="academyName"
                    placeholder="Enter academy name (e.g., Excellence Academy)"
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSaveAcademyName}
                    disabled={isLoadingAcademy}
                  >
                    {isLoadingAcademy ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  This name will appear in the student portal instead of "Student Portal". Leave empty to use default.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive notifications and alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications in the browser</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get important updates via email</p>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Theme</Label>
                <Select defaultValue="light">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your account security and privacy settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Session Timeout</Label>
                <Select defaultValue="30">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => toast({ title: "Info", description: "Password change feature coming soon" })}>
                  Change Password
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Info", description: "2FA feature coming soon" })}>
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System
              </CardTitle>
              <CardDescription>System-wide settings and data management.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Default Branch</Label>
                <Select defaultValue="main">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Branch</SelectItem>
                    <SelectItem value="north">North Branch</SelectItem>
                    <SelectItem value="south">South Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Date Format</Label>
                <Select defaultValue="mm/dd/yyyy">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Export, backup, and manage your data.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleExportData}>
                  Export Data
                </Button>
                <Button variant="outline" onClick={handleBackupSettings}>
                  Backup Settings
                </Button>
                <Button variant="outline" onClick={handleClearCache}>
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Settings */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
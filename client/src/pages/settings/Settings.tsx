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
      <div className="space-y-6 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your application preferences and system settings.</p>
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="academyName"
                    placeholder="Enter academy name"
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveAcademyName}
                    disabled={isLoadingAcademy}
                    className="w-full sm:w-auto"
                  >
                    {isLoadingAcademy ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1 text-center sm:text-left">
                  This name will appear in the student portal. Leave empty to use default.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-sm border-muted/50">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive notifications and alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
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
          <Card className="shadow-sm border-muted/50">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select defaultValue="light">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="shadow-sm border-muted/50">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your account security and privacy settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Select defaultValue="30">
                  <SelectTrigger className="w-full sm:w-[200px]">
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
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="outline" onClick={() => toast({ title: "Info", description: "Password change feature coming soon" })} className="w-full sm:w-auto">
                  Change Password
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Info", description: "2FA feature coming soon" })} className="w-full sm:w-auto">
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System */}
          <Card className="shadow-sm border-muted/50">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5" />
                System
              </CardTitle>
              <CardDescription>System-wide settings and data management.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Default Branch</Label>
                  <Select defaultValue="main">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Branch</SelectItem>
                      <SelectItem value="north">North Branch</SelectItem>
                      <SelectItem value="south">South Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select defaultValue="mm/dd/yyyy">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="shadow-sm border-muted/50">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Export, backup, and manage your data.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={handleExportData} className="w-full sm:flex-1">
                  Export Data
                </Button>
                <Button variant="outline" onClick={handleBackupSettings} className="w-full sm:flex-1">
                  Backup Settings
                </Button>
                <Button variant="outline" onClick={handleClearCache} className="w-full sm:flex-1 text-red-600 border-red-100 hover:bg-red-50">
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Settings */}
          <div className="flex justify-center sm:justify-end px-1 sm:px-0">
            <Button onClick={handleSaveSettings} size="lg" className="w-full sm:w-auto shadow-md">
              Save All Settings
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
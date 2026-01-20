import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Eye, EyeOff, UserCheck, UserX, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface StudentCredential {
  id: string;
  username: string;
  isActive: boolean;
  lastLogin?: string;
}

interface StudentCredentialsSectionProps {
  studentId: string;
  studentData: any;
  onUpdate: () => void;
}

export default function StudentCredentialsSection({
  studentId,
  studentData,
  onUpdate,
}: StudentCredentialsSectionProps) {
  const [credentials, setCredentials] = useState<StudentCredential | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCredentials();
  }, [studentId]);

  useEffect(() => {
    generatePassword();
  }, [studentData]);

  const loadCredentials = async () => {
    try {
      const response = await api.get(`/admin/student-credentials/${studentId}`);
      setCredentials(response);
    } catch {
      setCredentials(null);
    }
  };

  const generatePassword = () => {
    if (!studentData) return;

    const password = studentData.name
      ?.toLowerCase()
      .replace(/[^a-z]/g, '')
      .slice(0, 5) || 'student';

    setGeneratedPassword(password);
  };

  const createCredentials = async () => {
    setIsLoading(true);
    try {
      // Create credentials without specific username since students can use email/phone/ID
      await api.post('/admin/student-credentials', {
        studentId,
        username: studentData.email || studentData.phone || studentData.id, // Fallback username for admin reference
        password: generatedPassword,
      });
      
      toast({
        title: 'Success',
        description: 'Student portal access enabled successfully',
      });
      
      setIsCreateDialogOpen(false);
      loadCredentials();
      onUpdate();
    } catch (error: any) {
      console.error('Create credentials error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable portal access',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCredentialStatus = async () => {
    if (!credentials) return;
    
    try {
      await api.patch(`/admin/student-credentials/${credentials.id}`, {
        isActive: !credentials.isActive,
      });
      
      toast({
        title: 'Success',
        description: `Credentials ${!credentials.isActive ? 'enabled' : 'disabled'} successfully`,
      });
      
      loadCredentials();
    } catch (error: any) {
      console.error('Toggle credentials error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update credentials',
        variant: 'destructive',
      });
    }
  };

  const resetPassword = async () => {
    if (!credentials) return;
    
    setIsLoading(true);
    try {
      await api.patch(`/admin/student-credentials/${credentials.id}/reset-password`, {
        password: generatedPassword,
      });
      
      toast({
        title: 'Success',
        description: 'Password reset successfully',
      });
      
      setIsResetDialogOpen(false);
      loadCredentials();
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Student Login Credentials
        </CardTitle>
      </CardHeader>
      <CardContent>
        {credentials ? (
          <div className="space-y-6">
            {/* Login Information Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Student Login Username Options
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-800">Email:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">
                    {studentData?.email || 'Not provided'}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-800">Phone:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">
                    {studentData?.phone || 'Not provided'}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-800">Full Student ID:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 text-xs">
                    {studentData?.id}
                  </code>
                </div>
              </div>
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> Short ID ({studentData?.id?.slice(-8)}) is for internal reference only – not for login
                </p>
              </div>
            </div>

            {/* Credential Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Portal Access Status</p>
                <p className="text-sm text-muted-foreground">
                  Status: <Badge variant={credentials.isActive ? 'default' : 'secondary'}>
                    {credentials.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </p>
                {credentials.lastLogin && (
                  <p className="text-sm text-muted-foreground">
                    Last login: {new Date(credentials.lastLogin).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCredentialStatus}
                >
                  {credentials.isActive ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Enable
                    </>
                  )}
                </Button>
                
                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Student Password</DialogTitle>
                      <DialogDescription>
                        This will reset the student's password to the default generated password.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>New Password</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={generatedPassword}
                            readOnly
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Alert>
                        <Key className="h-4 w-4" />
                        <AlertDescription>
                          Share this new password with the student securely.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsResetDialogOpen(false)} disabled={isLoading}>
                          Cancel
                        </Button>
                        <Button onClick={resetPassword} disabled={isLoading}>
                          {isLoading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Student portal access is not enabled</p>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Key className="h-4 w-4 mr-2" />
                  Enable Portal Access
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enable Student Portal Access</DialogTitle>
                  <DialogDescription>
                    Enable portal access for the student. They can login using email, phone, or full student ID.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Login Username Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Valid Login Usernames</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800">Email:</span>
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">
                          {studentData?.email || 'Not provided'}
                        </code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800">Phone:</span>
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">
                          {studentData?.phone || 'Not provided'}
                        </code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800">Full Student ID:</span>
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 text-xs">
                          {studentData?.id}
                        </code>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                      <p className="text-xs text-amber-800">
                        <strong>Note:</strong> Short ID ({studentData?.id?.slice(-8)}) is for internal reference only – not for login
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Generated Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={generatedPassword}
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Password is generated from first 5 letters of student name
                    </p>
                  </div>
                  
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      Students can login using any of the valid usernames above with this password.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button onClick={createCredentials} disabled={isLoading}>
                      {isLoading ? 'Enabling...' : 'Enable Portal Access'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
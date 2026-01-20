import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Key, Eye, EyeOff, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  branchName?: string;
  program?: string;
  batch?: string;
}

interface StudentCredential {
  id: string;
  studentId: string;
  username: string;
  isActive: boolean;
  lastLogin?: string;
  studentName: string;
  branchName?: string;
}

export default function StudentCredentialManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [credentials, setCredentials] = useState<StudentCredential[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, credentialsData] = await Promise.all([
        api.get('/students'),
        api.get('/admin/student-credentials')
      ]);
      setStudents(studentsData);
      setCredentials(credentialsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student data',
        variant: 'destructive',
      });
    }
  };

  const generateUsername = (studentName: string) => {
    return studentName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
    const student = students.find(s => s.id === studentId);
    if (student) {\n      setUsername(generateUsername(student.name));\n      setPassword(generatePassword());\n    }\n  };\n\n  const createCredentials = async () => {\n    if (!selectedStudent || !username || !password) {\n      toast({\n        title: 'Error',\n        description: 'Please fill all fields',\n        variant: 'destructive',\n      });\n      return;\n    }\n\n    setIsLoading(true);\n    try {\n      await api.post('/admin/student-credentials', {\n        studentId: selectedStudent,\n        username,\n        password,\n      });\n      \n      toast({\n        title: 'Success',\n        description: 'Student credentials created successfully',\n      });\n      \n      setIsDialogOpen(false);\n      setSelectedStudent('');\n      setUsername('');\n      setPassword('');\n      loadData();\n    } catch (error: any) {\n      toast({\n        title: 'Error',\n        description: error.message || 'Failed to create credentials',\n        variant: 'destructive',\n      });\n    } finally {\n      setIsLoading(false);\n    }\n  };\n\n  const toggleCredentialStatus = async (credentialId: string, isActive: boolean) => {\n    try {\n      await api.patch(`/admin/student-credentials/${credentialId}`, {\n        isActive: !isActive,\n      });\n      \n      toast({\n        title: 'Success',\n        description: `Credential ${!isActive ? 'activated' : 'deactivated'} successfully`,\n      });\n      \n      loadData();\n    } catch (error: any) {\n      toast({\n        title: 'Error',\n        description: error.message || 'Failed to update credential status',\n        variant: 'destructive',\n      });\n    }\n  };\n\n  const deleteCredentials = async (credentialId: string) => {\n    if (!confirm('Are you sure you want to delete these credentials?')) {\n      return;\n    }\n\n    try {\n      await api.delete(`/admin/student-credentials/${credentialId}`);\n      \n      toast({\n        title: 'Success',\n        description: 'Credentials deleted successfully',\n      });\n      \n      loadData();\n    } catch (error: any) {\n      toast({\n        title: 'Error',\n        description: error.message || 'Failed to delete credentials',\n        variant: 'destructive',\n      });\n    }\n  };\n\n  const studentsWithoutCredentials = students.filter(\n    student => !credentials.some(cred => cred.studentId === student.id)\n  );\n\n  return (\n    <div className=\"space-y-6\">\n      <div className=\"flex justify-between items-center\">\n        <div>\n          <h2 className=\"text-2xl font-bold\">Student Portal Management</h2>\n          <p className=\"text-muted-foreground\">Manage student login credentials</p>\n        </div>\n        \n        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>\n          <DialogTrigger asChild>\n            <Button>\n              <UserPlus className=\"h-4 w-4 mr-2\" />\n              Create Credentials\n            </Button>\n          </DialogTrigger>\n          <DialogContent>\n            <DialogHeader>\n              <DialogTitle>Create Student Credentials</DialogTitle>\n              <DialogDescription>\n                Generate login credentials for a student to access the student portal.\n              </DialogDescription>\n            </DialogHeader>\n            \n            <div className=\"space-y-4\">\n              <div>\n                <Label>Select Student</Label>\n                <Select value={selectedStudent} onValueChange={handleStudentSelect}>\n                  <SelectTrigger>\n                    <SelectValue placeholder=\"Choose a student\" />\n                  </SelectTrigger>\n                  <SelectContent>\n                    {studentsWithoutCredentials.map((student) => (\n                      <SelectItem key={student.id} value={student.id}>\n                        {student.name} - {student.branchName}\n                      </SelectItem>\n                    ))}\n                  </SelectContent>\n                </Select>\n              </div>\n              \n              <div>\n                <Label>Username</Label>\n                <Input\n                  value={username}\n                  onChange={(e) => setUsername(e.target.value)}\n                  placeholder=\"Enter username\"\n                />\n              </div>\n              \n              <div>\n                <Label>Password</Label>\n                <div className=\"relative\">\n                  <Input\n                    type={showPassword ? 'text' : 'password'}\n                    value={password}\n                    onChange={(e) => setPassword(e.target.value)}\n                    placeholder=\"Enter password\"\n                  />\n                  <Button\n                    type=\"button\"\n                    variant=\"ghost\"\n                    size=\"icon\"\n                    className=\"absolute right-0 top-0\"\n                    onClick={() => setShowPassword(!showPassword)}\n                  >\n                    {showPassword ? <EyeOff className=\"h-4 w-4\" /> : <Eye className=\"h-4 w-4\" />}\n                  </Button>\n                </div>\n              </div>\n              \n              <Alert>\n                <Key className=\"h-4 w-4\" />\n                <AlertDescription>\n                  Save these credentials securely. Share them with the student for portal access.\n                </AlertDescription>\n              </Alert>\n              \n              <div className=\"flex justify-end gap-2\">\n                <Button variant=\"outline\" onClick={() => setIsDialogOpen(false)}>\n                  Cancel\n                </Button>\n                <Button onClick={createCredentials} disabled={isLoading}>\n                  {isLoading ? 'Creating...' : 'Create Credentials'}\n                </Button>\n              </div>\n            </div>\n          </DialogContent>\n        </Dialog>\n      </div>\n\n      {/* Existing Credentials */}\n      <Card>\n        <CardHeader>\n          <CardTitle>Existing Student Credentials</CardTitle>\n          <CardDescription>\n            Manage existing student portal access credentials\n          </CardDescription>\n        </CardHeader>\n        <CardContent>\n          {credentials.length > 0 ? (\n            <div className=\"space-y-4\">\n              {credentials.map((credential) => (\n                <div key={credential.id} className=\"flex items-center justify-between p-4 border rounded-lg\">\n                  <div className=\"flex-1\">\n                    <div className=\"flex items-center gap-3\">\n                      <h3 className=\"font-medium\">{credential.studentName}</h3>\n                      <Badge variant={credential.isActive ? 'default' : 'secondary'}>\n                        {credential.isActive ? 'Active' : 'Inactive'}\n                      </Badge>\n                    </div>\n                    <div className=\"text-sm text-muted-foreground mt-1\">\n                      Username: {credential.username}\n                      {credential.branchName && ` • ${credential.branchName}`}\n                      {credential.lastLogin && (\n                        ` • Last login: ${new Date(credential.lastLogin).toLocaleDateString()}`\n                      )}\n                    </div>\n                  </div>\n                  \n                  <div className=\"flex items-center gap-2\">\n                    <Button\n                      variant=\"outline\"\n                      size=\"sm\"\n                      onClick={() => toggleCredentialStatus(credential.id, credential.isActive)}\n                    >\n                      {credential.isActive ? 'Deactivate' : 'Activate'}\n                    </Button>\n                    <Button\n                      variant=\"outline\"\n                      size=\"sm\"\n                      onClick={() => deleteCredentials(credential.id)}\n                    >\n                      <Trash2 className=\"h-4 w-4\" />\n                    </Button>\n                  </div>\n                </div>\n              ))}\n            </div>\n          ) : (\n            <p className=\"text-center text-muted-foreground py-8\">\n              No student credentials created yet\n            </p>\n          )}\n        </CardContent>\n      </Card>\n    </div>\n  );\n}", "oldStr": ""}]
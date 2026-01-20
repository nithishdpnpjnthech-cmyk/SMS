import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap,
  Users,
  Building,
  Calendar
} from 'lucide-react';
import { studentApi } from '@/lib/student-api';

interface ProfileData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  parentPhone?: string;
  program?: string;
  batch?: string;
  branchName: string;
  joiningDate?: string;
  uniform: {
    issued: boolean;
    issueDate?: string;
  };
  academy: {
    name: string;
    phone?: string;
    address?: string;
  };
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await studentApi.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load profile data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your personal and academic information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              {/* Profile Header with Blue Background */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg -mx-6 -mt-6 px-6 pt-8 pb-4 mb-6">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white">
                  <AvatarFallback className="bg-white text-blue-600 text-2xl font-bold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="-mt-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h2>
                <p className="text-blue-600 font-medium mb-4">Student ID: {profile.id}</p>
                
                <div className="space-y-3 text-left">
                  {profile.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{profile.email}</span>
                    </div>
                  )}
                  
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{profile.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic & Guardian Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Academic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Academic Details
              </CardTitle>
              <p className="text-sm text-gray-600">Current enrollment information</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Branch / Stream
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {profile.program || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Batch / Year
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {profile.batch || 'Not assigned'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Academy Details
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {profile.academy.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Guardian Information
              </CardTitle>
              <p className="text-sm text-gray-600">Emergency contact and guardian details</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Guardian Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    Parent/Guardian Name
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Relationship
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    Parent / Guardian
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Contact Number
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {profile.parentPhone || 'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Institutional Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                Institutional Status
              </CardTitle>
              <p className="text-sm text-gray-600">Uniforms and other issuances</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Uniform Issued</p>
                  {profile.uniform.issued && profile.uniform.issueDate && (
                    <p className="text-sm text-gray-600">
                      Issued on: {new Date(profile.uniform.issueDate).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
                <Badge 
                  variant={profile.uniform.issued ? 'default' : 'secondary'}
                  className={profile.uniform.issued ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                >
                  {profile.uniform.issued ? 'Issued' : 'Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Institution Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-600" />
                Institution Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Academy Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {profile.academy.name}
                  </p>
                </div>
                
                {profile.academy.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Contact Number
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {profile.academy.phone}
                    </p>
                  </div>
                )}
                
                {profile.academy.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Address
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {profile.academy.address}
                    </p>
                  </div>
                )}
                
                {profile.joiningDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Enrollment Date
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {new Date(profile.joiningDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
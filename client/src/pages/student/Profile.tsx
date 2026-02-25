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
  Calendar,
  Shirt
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
      const profileData = await studentApi.getProfile() as any;
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
    <div className="space-y-8 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
      <div className="bg-white/50 p-4 sm:p-6 rounded-2xl border border-muted/50 backdrop-blur-sm shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">My Profile</h1>
        <p className="text-muted-foreground text-sm sm:text-base font-medium">Manage your personal and academic information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1 shadow-lg border-muted/50 overflow-hidden transform transition-all hover:shadow-xl">
          <CardContent className="p-0">
            <div className="text-center">
              {/* Profile Header with Modern Gradient */}
              <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 pt-10 pb-20 mb-[-64px] relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              </div>

              <div className="relative px-6 pb-8">
                <Avatar className="h-32 w-32 mx-auto mb-4 border-8 border-white shadow-2xl relative z-10 transition-transform hover:scale-105">
                  <AvatarFallback className="bg-blue-50 text-primary text-3xl font-black font-heading">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-gray-900 font-heading tracking-tight">{profile.name}</h2>
                  <div className="inline-flex items-center gap-1 bg-blue-50 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                    ID: {profile.id}
                  </div>
                </div>

                <div className="mt-8 space-y-4 text-left bg-muted/20 p-5 rounded-2xl border border-muted/50 shadow-inner">
                  {profile.email && (
                    <div className="flex items-center gap-3 group">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-bold text-gray-600 truncate">{profile.email}</span>
                    </div>
                  )}

                  {profile.phone && (
                    <div className="flex items-center gap-3 group">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-bold text-gray-600">{profile.phone}</span>
                    </div>
                  )}

                  {profile.address && (
                    <div className="flex items-start gap-3 group">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm border border-muted/50 text-muted-foreground group-hover:text-primary transition-colors mt-0.5">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-bold text-gray-600 leading-relaxed">{profile.address}</span>
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
          <Card className="shadow-lg border-muted/50 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-muted/50 px-4 sm:px-6">
              <CardTitle className="flex items-center gap-3 text-lg font-heading">
                <div className="p-2 bg-blue-100 rounded-lg text-primary shadow-sm">
                  <GraduationCap className="h-5 w-5" />
                </div>
                Enrollment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                    ACADEMIC STREAM
                  </label>
                  <p className="text-lg font-black text-gray-900 font-heading">
                    {profile.program || 'GENERAL'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                    CURRENT BATCH
                  </label>
                  <p className="text-lg font-black text-gray-900 font-heading">
                    {profile.batch || 'DEFAULT'}
                  </p>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                    ASSIGNED BRANCH
                  </label>
                  <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-muted/50 shadow-inner">
                    <Building className="h-6 w-6 text-primary/60" />
                    <div>
                      <p className="text-base font-bold text-gray-900 leading-none">{profile.branchName}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Primary training location</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card className="shadow-lg border-muted/50 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-muted/50 px-4 sm:px-6">
              <CardTitle className="flex items-center gap-3 text-lg font-heading">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600 shadow-sm">
                  <Users className="h-5 w-5" />
                </div>
                Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                    GUARDIAN NAME
                  </label>
                  <p className="text-lg font-black text-gray-900 font-heading">
                    Parent / Guardian
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                    PRIMARY CONTACT
                  </label>
                  <div className="flex items-center gap-2 text-lg font-black text-gray-900 font-heading">
                    <Phone className="h-4 w-4 text-purple-500" />
                    {profile.parentPhone || 'NOT PROVIDED'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Institutional Status */}
          <Card className="shadow-lg border-muted/50 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-muted/50 px-4 sm:px-6">
              <CardTitle className="flex items-center gap-3 text-lg font-heading">
                <div className="p-2 bg-green-100 rounded-lg text-green-600 shadow-sm">
                  <Shirt className="h-5 w-5" />
                </div>
                Asset Issuance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between bg-muted/10 p-4 rounded-2xl border border-muted/50 shadow-sm group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl shadow-sm ${profile.uniform.issued ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    <Shirt className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 font-heading">Academy Uniform</p>
                    {profile.uniform.issued && profile.uniform.issueDate ? (
                      <p className="text-xs font-bold text-muted-foreground uppercase mt-0.5">
                        COLLECTED ON {new Date(profile.uniform.issueDate).toLocaleDateString('en-IN').toUpperCase()}
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-orange-600 uppercase mt-0.5">Awaiting Collection</p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`px-4 py-1.5 font-black border-none shadow-sm ${profile.uniform.issued ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                >
                  {profile.uniform.issued ? 'ISSUED' : 'PENDING'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Institution Details */}
          <Card className="shadow-lg border-muted/50 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-muted/50 px-4 sm:px-6">
              <CardTitle className="flex items-center gap-3 text-lg font-heading">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shadow-sm">
                  <Building className="h-5 w-5" />
                </div>
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted/50 pb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                      ACADEMY ENTITY
                    </label>
                    <p className="text-base font-black text-gray-900 font-heading">
                      {profile.academy.name}
                    </p>
                  </div>
                  {profile.joiningDate && (
                    <div className="space-y-1 text-left sm:text-right">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                        ENROLLMENT DATE
                      </label>
                      <p className="text-base font-bold text-gray-900">
                        {new Date(profile.joiningDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {profile.academy.phone && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                        CENTRAL SUPPORT
                      </label>
                      <p className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-indigo-500" />
                        {profile.academy.phone}
                      </p>
                    </div>
                  )}

                  {profile.academy.address && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                        HEADQUARTERS
                      </label>
                      <p className="text-sm font-bold text-gray-900 flex items-start gap-2 leading-relaxed">
                        <MapPin className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        {profile.academy.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Users,
  Building,
  Calendar,
  Shirt,
  CreditCard,
  Download
} from 'lucide-react';
import { studentApi } from '@/lib/student-api';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

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
  const [showIdCard, setShowIdCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
    if (!name) return 'S';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleDownloadIdCard = async () => {
    if (!cardRef.current) {
      toast({
        title: "Error",
        description: "ID card not ready. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: "#f97316",
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "Download Failed",
            description: "Could not generate PNG. Please try again.",
            variant: "destructive"
          });
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `id-card-${profile?.name?.replace(/\s+/g, '-').toLowerCase() || 'student'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "ID card downloaded successfully"
        });
      }, 'image/png');
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Could not generate PNG. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                  <AvatarFallback className="bg-orange-50 text-primary text-3xl font-black font-heading">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-gray-900 font-heading tracking-tight">{profile.name}</h2>
                  <div className="inline-flex items-center gap-1 bg-orange-50 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-orange-100 shadow-sm">
                    ID: {profile.id}
                  </div>
                </div>

                <Button
                  onClick={() => setShowIdCard(true)}
                  className="w-full mt-6 h-11 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  View ID Card
                </Button>

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
                <div className="p-2 bg-orange-100 rounded-lg text-primary shadow-sm">
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
                <div className="p-2 bg-yellow-100 rounded-lg text-orange-600 shadow-sm">
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
                    <Phone className="h-4 w-4 text-orange-500" />
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
                <div className="p-2 bg-yellow-100 rounded-lg text-orange-600 shadow-sm">
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
                        <Phone className="h-4 w-4 text-orange-500" />
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
                        <MapPin className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
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

      {/* ID Card Modal */}
      <Dialog open={showIdCard} onOpenChange={setShowIdCard}>
        <DialogContent className="max-w-md bg-white border-0 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-3 text-xl font-black font-heading tracking-tight text-gray-900">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                <CreditCard className="h-6 w-6" />
              </div>
              Student ID Card
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div
              ref={cardRef}
              data-card="id-card"
              className="relative w-full aspect-[1.6/1] bg-[#f97316] text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between"
              style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

              <div className="relative z-10 p-6 flex justify-between items-start">
                <div className="space-y-0.5">
                  <h3 className="font-black text-sm tracking-[0.2em] uppercase opacity-90">STUDENT IDENTITY</h3>
                  <div className="h-0.5 w-8 bg-white/50 rounded-full"></div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md">ACADEMY PASS</span>
                </div>
              </div>

              <div className="relative z-10 px-6 flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 bg-white rounded-2xl p-3 shadow-xl flex items-center justify-center">
                    <div className="text-4xl font-black text-primary">
                      {(profile?.name || 'S').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="space-y-0.5 flex-1 min-w-0">
                  <h4 className="text-2xl font-black font-heading tracking-tight truncate leading-none mb-1 uppercase">{profile?.name}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">ID: {String(profile?.id || "").slice(0, 8)}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[8px] font-black uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded leading-none">
                      {profile?.program || 'GENERAL'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 bg-black/20 backdrop-blur-md p-4 flex justify-between items-center border-t border-white/10">
                <div className="flex gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/50">BATCH</p>
                    <p className="text-[10px] font-bold">{profile?.batch || 'DEFAULT'}</p>
                  </div>
                  <div className="space-y-0.5 border-l border-white/10 pl-4">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/50">JOINED</p>
                    <p className="text-[10px] font-bold">{profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN') : 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black tracking-tighter opacity-80 uppercase">HUURA ACADEMY</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => setShowIdCard(false)}
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black uppercase text-xs tracking-widest rounded-xl transition-all"
              >
                Close
              </Button>
              <Button
                onClick={handleDownloadIdCard}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, LogIn, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAcademyBranding } from '@/hooks/use-academy-branding';
import { updatePageTitle } from '@/lib/page-title';
import { cn } from '@/lib/utils';

interface StudentLoginProps {
  onLogin: (credentials: { username: string; password: string }) => Promise<void>;
}

export default function StudentLogin({ onLogin }: StudentLoginProps) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();
  const { branding, getPortalName } = useAcademyBranding();

  // Update page title for login page
  useEffect(() => {
    updatePageTitle(branding.academyName, 'Login');
  }, [branding.academyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onLogin(credentials);
      setLocation('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse [animation-delay:2s]"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

      <div className="w-full max-w-md px-4 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-3xl bg-blue-600 shadow-2xl shadow-blue-500/40 mb-6 group hover:scale-110 transition-transform duration-500">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading leading-tight mb-2">
            {getPortalName()}
          </h1>
          <p className="text-slate-400 font-medium tracking-wide uppercase text-[10px] bg-slate-800/50 inline-block px-4 py-1.5 rounded-full border border-slate-700/50">
            Official Student Access Portal
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="pt-8 pb-4 text-center border-b border-slate-800/50">
            <CardTitle className="text-xl font-bold text-white font-heading">Secure Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Please enter your credentials to proceed
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-shake">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                  {error}
                </div>
              )}

              <div className="space-y-2.5">
                <Label htmlFor="username" className="text-slate-300 font-bold ml-1 text-xs uppercase tracking-widest">Registration ID / Email</Label>
                <div className="relative group">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter ID or Email"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    required
                    disabled={isLoading}
                    className="h-14 bg-slate-800/50 border-slate-700 text-white rounded-2xl pl-12 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500 text-base"
                  />
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-slate-300 font-bold text-xs uppercase tracking-widest">Secret Key / Password</Label>
                  <Button variant="link" className="text-[10px] text-blue-400 font-black p-0 h-auto uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Forgot?</Button>
                </div>
                <div className="relative group">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                    disabled={isLoading}
                    className="h-14 bg-slate-800/50 border-slate-700 text-white rounded-2xl pl-12 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-500 text-base"
                  />
                  <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors opacity-50" />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white text-base font-black rounded-2xl shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>AUTHORIZING...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>ACCESS PORTAL</span>
                    <LogIn className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-10 text-center border-t border-slate-800/50 pt-8">
              <Button
                variant="ghost"
                onClick={() => setLocation('/')}
                className="text-xs font-black text-slate-400 hover:text-white uppercase tracking-widest gap-2 bg-slate-800/30 px-6 py-6 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all active:scale-95 group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Staff Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-40">
          Protected by AES-256 Encryption & MFA
        </p>
      </div>
    </div>
  );
}
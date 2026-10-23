import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Sparkles,
  Trophy,
  Activity,
  CalendarCheck
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ALLOWED_EMAIL_DOMAIN } from '../constants';

export default function Login() {
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/');
    }
  }, [authLoading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.data?.token) {
        localStorage.setItem('campusplay_token', res.data.data.token);
      }
      await refresh();
      const nextUser = res.data?.data?.user;
      if (nextUser?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      const data = err?.response?.data;
      const firstValidationMsg = Array.isArray(data?.errors) && data.errors[0]?.msg;
      setError(firstValidationMsg || data?.message || 'Unable to sign in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-140px)] py-6 sm:py-10 px-4 font-jakarta">
      {/* 2-COLUMN PREMIUM ATHLETIC AUTH CONTAINER */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white/95 backdrop-blur-xl border border-white/80 rounded-[28px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12),0_10px_25px_-5px_rgba(37,99,235,0.08),inset_0_1px_1px_rgba(255,255,255,1)] animate-fade-in ring-1 ring-slate-900/5">
        
        {/* LEFT BRAND & VISUAL SHOWCASE PANEL */}
        <div className="lg:col-span-5 relative bg-[#0B192C] min-h-[260px] lg:min-h-[500px] flex flex-col justify-between p-6 sm:p-8 text-white overflow-hidden">
          {/* Authentic Campus Grounds Photography */}
          <div className="absolute inset-0 z-0 opacity-45">
            <Image 
              src="/images/campus-grounds.jpg" 
              alt="Campus sports grounds and stadium" 
              fill 
              className="object-cover object-[center_65%] scale-105 transition-transform duration-700 hover:scale-100"
              priority
            />
          </div>

          {/* Athletic High-Contrast Gradient Veil */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C] via-[#0B192C]/85 to-[#1D4ED8]/30 z-0" />
          
          {/* Subtle Athletic Jersey Perforated Pattern */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20 z-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* TOP ATHLETIC IDENTITY PILL & HEADLINE */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-extrabold tracking-wider uppercase mb-4 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Athletic Portal Access</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Elevate Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#93C5FD]">
                Campus Game.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed mt-2 max-w-[280px]">
              Live ground scheduling, timetable conflict checks & equipment checkout.
            </p>
          </div>

          {/* BOTTOM GLASSMORPHIC TRUST CARD */}
          <div className="relative z-10 mt-6 lg:mt-0 p-4 rounded-[18px] bg-white/10 backdrop-blur-md border border-white/15 shadow-lg space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs font-bold text-white">
              <div className="w-6 h-6 rounded-lg bg-[#2563EB]/40 flex items-center justify-center text-white flex-shrink-0">
                <Trophy size={13} className="text-[#60A5FA]" />
              </div>
              <span>4 Verified Campus Sports Venues</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-white">
              <div className="w-6 h-6 rounded-lg bg-[#10B981]/40 flex items-center justify-center text-white flex-shrink-0">
                <Activity size={13} className="text-[#34D399]" />
              </div>
              <span>Atomic Concurrency Conflict Guard</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-white">
              <div className="w-6 h-6 rounded-lg bg-[#38BDF8]/40 flex items-center justify-center text-white flex-shrink-0">
                <ShieldCheck size={13} className="text-[#38BDF8]" />
              </div>
              <span>Institutional @vit.edu.in SSO Access</span>
            </div>
          </div>
        </div>

        {/* RIGHT INTERACTIVE FORM PANEL */}
        <div className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 bg-white/70">
          
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-[#BFDBFE]/60 mb-2.5">
              <Sparkles size={12} className="text-[#2563EB]" />
              <span>Campus Identity SSO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[#52657A] mt-1.5 font-medium">
              Sign in with your official university credentials to reserve grounds.
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-5 rounded-[14px] border border-[#FECACA] bg-[#FEE2E2]/80 backdrop-blur-xs p-3.5 text-xs font-semibold text-[#B91C1C] flex items-center gap-2.5 animate-scale-in shadow-xs">
              <AlertCircle size={18} className="flex-shrink-0 text-[#EF4444]" />
              <span className="text-[#B91C1C]">{error}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={submit} className="space-y-4" aria-label="Login form">
            
            {/* EMAIL FIELD */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5 block">
                Campus Email
              </label>
              <div className="relative">
                <input 
                  aria-label="Email" 
                  autoComplete="email"
                  className="w-full h-[48px] pl-10 pr-4 text-sm font-semibold rounded-[14px] border border-[#DCE6F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 focus:outline-none transition-all duration-200 shadow-xs" 
                  placeholder={`yourname${ALLOWED_EMAIL_DOMAIN}`} 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none transition-colors" />
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-[#64748B]">
                Must end with <span className="text-[#2563EB] font-bold">{ALLOWED_EMAIL_DOMAIN}</span>
              </p>
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                  Password
                </label>
              </div>
              <div className="relative">
                <input 
                  aria-label="Password" 
                  autoComplete="current-password"
                  className="w-full h-[48px] pl-10 pr-11 text-sm font-semibold rounded-[14px] border border-[#DCE6F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 focus:outline-none transition-all duration-200 shadow-xs" 
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none transition-colors" />
                <button 
                  type="button" 
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] rounded-md transition-colors" 
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* PRIMARY CTA BUTTON */}
            <button 
              aria-label="Submit login" 
              className="relative group w-full h-[50px] rounded-[14px] text-sm font-extrabold text-white flex items-center justify-center gap-2 mt-4 bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] hover:from-[#1D4ED8] hover:to-[#1E3A8A] active:scale-[0.99] shadow-[0_8px_20px_rgba(37,99,235,0.32)] hover:shadow-[0_10px_24px_rgba(37,99,235,0.4)] transition-all duration-200 overflow-hidden focus:outline-none focus:ring-4 focus:ring-[#2563EB]/25" 
              type="submit" 
              disabled={loading || !email || !password}
            >
              {/* Top Specular Sheen */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="text-white">Authenticating...</span>
                </div>
              ) : (
                <>
                  <span className="text-white tracking-wide">Sign In to CampusPlay</span>
                  <ArrowRight size={17} className="text-white group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* FOOTER VERIFICATION INFO & SWITCH LINK */}
            <div className="pt-4 mt-2 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-semibold text-[#64748B]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#52657A]">
                <ShieldCheck size={14} className="text-[#10B981]" />
                <span>Protected by Campus Auth</span>
              </div>

              <div>
                <span>Don't have an account? </span>
                <Link href="/register" className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-extrabold">
                  Register here →
                </Link>
              </div>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}

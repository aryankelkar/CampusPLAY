import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAIL, ALLOWED_EMAIL_DOMAIN } from '../constants';

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
      window.location.href = '/';
    }
  }, [authLoading, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const isValidEmail = (emailVal: string) => {
      const clean = emailVal.trim().toLowerCase();
      return clean.endsWith(ALLOWED_EMAIL_DOMAIN) || clean === ADMIN_EMAIL.toLowerCase();
    };

    if (!isValidEmail(email)) {
      setError(`Please use your official campus email (${ALLOWED_EMAIL_DOMAIN}) to sign in.`);
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/login', { email: email.trim(), password });
      await refresh();
      window.location.href = '/';
    } catch (err: any) {
      const data = err?.response?.data;
      const firstValidationMsg = Array.isArray(data?.errors) && data.errors.length > 0 ? data.errors[0].msg : '';
      setError(firstValidationMsg || data?.message || 'Unable to sign in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-140px)] py-4 font-jakarta">
      {/* 2-COLUMN VIEWPORT-FIRST AUTH CONTAINER */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#E8EEF5] rounded-[22px] p-3 sm:p-4 md:p-6 shadow-[7px_7px_18px_rgba(148,163,184,0.16),-7px_-7px_18px_rgba(255,255,255,0.9)] animate-fade-in">
        
        {/* LEFT BRAND PANEL (45% on desktop) */}
        <div className="lg:col-span-5 relative rounded-[18px] overflow-hidden bg-[#0F172A] min-h-[220px] lg:min-h-[460px] flex flex-col justify-between p-6 sm:p-8 text-white shadow-md">
          {/* Background Image with Vibrant Sports Overlay */}
          <div className="absolute inset-0 z-0 opacity-60">
            <Image 
              src="/images/hero-sports.png" 
              alt="Campus sports grounds" 
              fill 
              className="object-cover object-center"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-[#0F172A]/30 z-0" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-extrabold uppercase tracking-widest bg-[#2563EB] text-white px-3 py-1 rounded-lg shadow-sm">
                CampusPlay
              </span>
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Campus sports,<br />simplified.
            </h2>
          </div>

          {/* Bottom Value Props */}
          <div className="relative z-10 mt-6 lg:mt-0 space-y-3">
            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-white drop-shadow-sm">
              <CheckCircle2 size={18} className="text-[#38BDF8] flex-shrink-0" />
              <span className="text-white">Reserve university grounds in real-time</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-white drop-shadow-sm">
              <CheckCircle2 size={18} className="text-[#38BDF8] flex-shrink-0" />
              <span className="text-white">Check live slot availability instantly</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-white drop-shadow-sm">
              <CheckCircle2 size={18} className="text-[#38BDF8] flex-shrink-0" />
              <span className="text-white">Manage & track all student reservations</span>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL (55% on desktop) */}
        <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-4 lg:px-6 py-2">
          
          {/* Header */}
          <div className="mb-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#DBEAFE] px-2.5 py-0.5 rounded-md border border-[#BFDBFE] inline-block mb-1.5">
              Campus Identity
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[#52657A] mt-1">
              Sign in with your official campus credentials to reserve grounds.
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEE2E2] p-3 text-xs font-semibold text-[#B91C1C] flex items-center gap-2.5 animate-scale-in">
              <AlertCircle size={18} className="flex-shrink-0 text-[#EF4444]" />
              <span className="text-[#B91C1C]">{error}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={submit} className="space-y-4" aria-label="Login form">
            
            {/* EMAIL FIELD */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5 block">
                Campus Email
              </label>
              <div className="relative">
                <input 
                  aria-label="Email" 
                  autoComplete="email"
                  className="input input-has-icon-left h-[46px] text-sm font-semibold w-full rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs" 
                  placeholder={`yourname${ALLOWED_EMAIL_DOMAIN}`} 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8897A8] pointer-events-none z-10" />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#52657A]">
                Use your official university email ending with <span className="text-[#2563EB] font-bold">{ALLOWED_EMAIL_DOMAIN}</span>
              </p>
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input 
                  aria-label="Password" 
                  autoComplete="current-password"
                  className="input input-has-icon-left input-has-icon-right h-[46px] text-sm font-semibold w-full rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs" 
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8897A8] pointer-events-none z-10" />
                <button 
                  type="button" 
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#52657A] hover:text-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] rounded-md transition-colors z-10" 
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>



            {/* PRIMARY CTA BUTTON */}
            <button 
              aria-label="Submit login" 
              className="btn btn-primary w-full h-[48px] rounded-[12px] text-sm font-bold text-white flex items-center justify-center gap-2 mt-2 shadow-md transition-all duration-200" 
              type="submit" 
              disabled={loading || !email || !password}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="text-white">Signing In...</span>
                </div>
              ) : (
                <>
                  <span className="text-white">Sign In</span>
                  <ArrowRight size={18} className="text-white" />
                </>
              )}
            </button>

            {/* FOOTER VERIFICATION INFO & SWITCH LINK */}
            <div className="pt-3 border-t border-[#DCE6F0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-[#52657A]">
              <div className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck size={14} className="text-[#2563EB]" />
                <span>Protected by Campus Auth</span>
              </div>

              <div>
                <span>Don't have an account? </span>
                <Link href="/register" className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-bold">
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


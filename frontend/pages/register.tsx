import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, Hash, Lock, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api';
import { ADMIN_EMAIL, ALLOWED_EMAIL_DOMAIN, BRANCHES, DIVISIONS, CLASS_YEARS } from '../constants';
import { isValidCollegeEmail, isValidRollNumber } from '../utils/helpers';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roll, setRoll] = useState('');
  const [branch, setBranch] = useState('');
  const [division, setDivision] = useState('');
  const [classYear, setClassYear] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isAdminEmail = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isCollegeEmail = isValidCollegeEmail(email.trim().toLowerCase());
  const rollValid = isAdminEmail ? true : isValidRollNumber(roll.trim().toUpperCase());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isCollegeEmail) {
      setError(`Only official campus emails ending with ${ALLOWED_EMAIL_DOMAIN} are allowed.`);
      return;
    }
    if (!isAdminEmail) {
      if (!rollValid) { setError('Invalid roll number. Must be alphanumeric (1-10 characters).'); return; }
      if (!branch || !division || !classYear) { setError('Branch, Division, and Class Year are required.'); return; }
    }
    if (password.length < 8) { setError('Password must be at least 8 characters long'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[a-z]/.test(password)) { setError('Password must contain at least one lowercase letter'); return; }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one number'); return; }

    try {
      setLoading(true);
      await api.post('/auth/register', { name, email: email.trim(), password, roll, branch, division, classYear });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      const data = err?.response?.data;
      const firstValidationMsg = Array.isArray(data?.errors) && data.errors.length > 0 ? data.errors[0].msg : '';
      setError(firstValidationMsg || data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-140px)] py-4 font-jakarta">
      {/* 2-COLUMN VIEWPORT-FIRST AUTH CONTAINER */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#E8EEF5] rounded-[22px] p-3 sm:p-4 md:p-6 shadow-[7px_7px_18px_rgba(148,163,184,0.16),-7px_-7px_18px_rgba(255,255,255,0.9)] animate-fade-in">
        
        {/* LEFT BRAND PANEL (40% on desktop) */}
        <div className="lg:col-span-4 relative rounded-[18px] overflow-hidden bg-[#0F172A] min-h-[180px] lg:min-h-[520px] flex flex-col justify-between p-6 text-white shadow-inner">
          {/* Background Image with Dark Blue Tint */}
          <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
            <Image 
              src="/images/hero-sports.png" 
              alt="Campus sports grounds" 
              fill 
              className="object-cover object-center"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-[#2563EB]/40 z-0" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest bg-[#2563EB] text-white px-2.5 py-0.5 rounded-md">
                CampusPlay
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white leading-tight">
              Create your<br />student profile.
            </h2>
          </div>

          {/* Bottom Value Props */}
          <div className="relative z-10 mt-4 lg:mt-0 space-y-2.5 text-xs sm:text-sm font-semibold text-white">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#38BDF8] flex-shrink-0" />
              <span className="text-white">Official campus email verification</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#38BDF8] flex-shrink-0" />
              <span className="text-white">Instant slot reservations</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#38BDF8] flex-shrink-0" />
              <span className="text-white">Fair & transparent booking system</span>
            </div>
          </div>
        </div>


        {/* RIGHT FORM PANEL (60% on desktop) */}
        <div className="lg:col-span-8 flex flex-col justify-center px-1 sm:px-3 lg:px-4 py-1">
          
          {/* Header */}
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#DBEAFE] px-2.5 py-0.5 rounded-md border border-[#BFDBFE] inline-block mb-1">
              Student Registration
            </span>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              CREATE YOUR ACCOUNT
            </h1>
            <p className="text-xs text-[#52657A]">
              Register with your official campus credentials to book grounds.
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-3 rounded-xl border border-[#FECACA] bg-[#FEE2E2] p-2.5 text-xs font-semibold text-[#B91C1C] flex items-center gap-2 animate-scale-in">
              <AlertCircle size={16} className="flex-shrink-0 text-[#EF4444]" />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS ALERT */}
          {success && (
            <div className="mb-3 rounded-xl border border-[#A7F3D0] bg-[#DCFCE7] p-2.5 text-xs font-semibold text-[#047857] flex items-center gap-2 animate-scale-in">
              <CheckCircle2 size={16} className="flex-shrink-0 text-[#10B981]" />
              <span>{success}</span>
            </div>
          )}

          {/* REGISTRATION FORM */}
          <form onSubmit={submit} className="space-y-3" aria-label="Register form">
            
            {/* ROW 1: PERSONAL & EMAIL */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1 block">Full Name</label>
                <div className="relative">
                  <input 
                    aria-label="Full name" 
                    autoComplete="name"
                    className="input input-has-icon-left h-[44px] text-xs sm:text-sm font-semibold w-full rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs" 
                    placeholder="John Doe" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8897A8] pointer-events-none z-10" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1 block">Campus Email</label>
                <div className="relative">
                  <input 
                    aria-label="Email" 
                    autoComplete="email"
                    className="input input-has-icon-left h-[44px] text-xs sm:text-sm font-semibold w-full rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs" 
                    placeholder={`yourname${ALLOWED_EMAIL_DOMAIN}`} 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8897A8] pointer-events-none z-10" />
                </div>
                {!isCollegeEmail && email && (
                  <p className="mt-0.5 text-[10px] font-bold text-[#EF4444]">Must end with {ALLOWED_EMAIL_DOMAIN}</p>
                )}
              </div>
            </div>

            {/* ROW 2: ROLL NUMBER & PASSWORD */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1 block">Roll Number</label>
                <div className="relative">
                  <input 
                    aria-label="Roll Number" 
                    className="input input-has-icon-left h-[44px] text-xs sm:text-sm font-semibold uppercase w-full rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs" 
                    placeholder="24CS101" 
                    value={roll} 
                    onChange={(e) => setRoll(e.target.value.toUpperCase())} 
                    required={!isAdminEmail} 
                    disabled={isAdminEmail} 
                    maxLength={10} 
                  />
                  <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8897A8] pointer-events-none z-10" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1 block">Password</label>
                <div className="relative">
                  <input 
                    aria-label="Password" 
                    autoComplete="new-password"
                    className="input input-has-icon-left input-has-icon-right h-[44px] text-xs sm:text-sm font-semibold w-full rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs" 
                    placeholder="Min 8 chars" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8897A8] pointer-events-none z-10" />
                  <button 
                    type="button" 
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52657A] hover:text-[#2563EB] p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#2563EB] z-10" 
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>


            {/* ROW 3: ACADEMIC DETAILS */}
            <div className="grid gap-3 grid-cols-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1 block">Branch</label>
                <select 
                  aria-label="Branch" 
                  className="input h-[44px] text-xs font-semibold bg-white px-2.5 w-full rounded-[12px] border border-[#DCE6F0] text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20" 
                  value={branch} 
                  onChange={(e) => setBranch(e.target.value)} 
                  required={!isAdminEmail} 
                  disabled={isAdminEmail}
                >
                  <option value="">Branch</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1 block">Division</label>
                <select 
                  aria-label="Division" 
                  className="input h-[44px] text-xs font-semibold bg-white px-2.5 w-full rounded-[12px] border border-[#DCE6F0] text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20" 
                  value={division} 
                  onChange={(e) => setDivision(e.target.value)} 
                  required={!isAdminEmail} 
                  disabled={isAdminEmail}
                >
                  <option value="">Div</option>
                  {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1 block">Year</label>
                <select 
                  aria-label="Class Year" 
                  className="input h-[44px] text-xs font-semibold bg-white px-2.5 w-full rounded-[12px] border border-[#DCE6F0] text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20" 
                  value={classYear} 
                  onChange={(e) => setClassYear(e.target.value)} 
                  required={!isAdminEmail} 
                  disabled={isAdminEmail}
                >
                  <option value="">Year</option>
                  {CLASS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* HELPER BOX */}
            <div className="p-2.5 rounded-[12px] bg-[#F8FAFC] border border-[#DCE6F0] text-[11px] text-[#52657A] font-semibold flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#2563EB] flex-shrink-0" />
              <span>Password requires 8+ chars with uppercase, lowercase & number.</span>
            </div>

            {/* PRIMARY CTA BUTTON */}
            <button 
              aria-label="Submit registration" 
              className="btn btn-primary w-full h-[46px] rounded-[12px] text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 shadow-md transition-all duration-200" 
              type="submit" 
              disabled={loading || !name || !isCollegeEmail || (!isAdminEmail && (!rollValid || !branch || !division || !classYear)) || password.length < 8}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* SWITCH LINK */}
            <div className="pt-2 border-t border-[#DCE6F0] text-center text-xs font-semibold text-[#52657A]">
              <span>Already have an account? </span>
              <Link href="/login" className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-bold">
                Sign in →
              </Link>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}


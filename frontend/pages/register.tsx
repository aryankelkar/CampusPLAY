import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, 
  Mail, 
  Hash, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Phone,
  Sparkles,
  Trophy,
  Activity,
  Layers
} from 'lucide-react';
import api from '../lib/api';
import { ADMIN_EMAIL, ALLOWED_EMAIL_DOMAIN, BRANCHES, DIVISIONS, CLASS_YEARS } from '../constants';
import { isValidCollegeEmail, isValidRollNumber, isValidPhoneNumber } from '../utils/helpers';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
  const isCollegeEmail = isValidCollegeEmail(email);
  const rollValid = isAdminEmail || isValidRollNumber(roll);
  const phoneValid = isAdminEmail || isValidPhoneNumber(phone);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isCollegeEmail) {
      setError(`Email must end with ${ALLOWED_EMAIL_DOMAIN}`);
      return;
    }

    if (!isAdminEmail && !rollValid) {
      setError('Please enter a valid roll number (e.g., 24CS101 or 12345)');
      return;
    }

    if (!isAdminEmail && !phoneValid) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name,
        email,
        password,
      };

      if (!isAdminEmail) {
        payload.phone = phone.trim();
        payload.rollNumber = roll.toUpperCase();
        payload.branch = branch;
        payload.division = division;
        payload.classYear = classYear;
      }

      const res = await api.post('/auth/register', payload);
      setSuccess('Account created successfully! Redirecting...');
      if (res.data?.data?.token) {
        localStorage.setItem('campusplay_token', res.data.data.token);
      }
      setTimeout(() => {
        router.push(isAdminEmail ? '/admin/dashboard' : '/');
      }, 1000);
    } catch (err: any) {
      const data = err?.response?.data;
      const firstValidationMsg = Array.isArray(data?.errors) && data.errors[0]?.msg;
      setError(firstValidationMsg || data?.message || 'Registration failed. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-140px)] py-6 sm:py-10 px-4 font-jakarta">
      {/* 2-COLUMN VIEWPORT-FIRST AUTH CONTAINER */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white/95 backdrop-blur-xl border border-white/80 rounded-[28px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12),0_10px_25px_-5px_rgba(37,99,235,0.08),inset_0_1px_1px_rgba(255,255,255,1)] ring-1 ring-slate-900/5 animate-fade-in">
        
        {/* LEFT BRAND & VISUAL SHOWCASE PANEL (40% on desktop) */}
        <div className="lg:col-span-4 relative bg-[#0B192C] min-h-[240px] lg:min-h-[580px] flex flex-col justify-between p-6 sm:p-8 text-white overflow-hidden">
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

          {/* Athletic Gradient Veil */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C] via-[#0B192C]/85 to-[#1D4ED8]/30 z-0" />
          
          {/* Athletic Jersey Perforated Dot Mesh */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20 z-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* TOP ATHLETIC IDENTITY PILL & HEADLINE */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-extrabold tracking-wider uppercase mb-3 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Student Enrollment</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              Unlock All Campus<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#93C5FD]">
                Athletic Facilities.
              </span>
            </h2>
            <p className="text-xs text-slate-300 font-normal leading-relaxed mt-1.5">
              Instant slot booking, academic timetable protection & gear rentals.
            </p>
          </div>

          {/* BOTTOM VALUE PROPS CARD */}
          <div className="relative z-10 mt-6 lg:mt-0 p-3.5 rounded-[18px] bg-white/10 backdrop-blur-md border border-white/15 shadow-lg space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <div className="w-5 h-5 rounded-md bg-[#2563EB]/40 flex items-center justify-center text-white flex-shrink-0">
                <ShieldCheck size={12} className="text-[#60A5FA]" />
              </div>
              <span>Official @vit.edu.in Verification</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <div className="w-5 h-5 rounded-md bg-[#10B981]/40 flex items-center justify-center text-white flex-shrink-0">
                <Activity size={12} className="text-[#34D399]" />
              </div>
              <span>Timetable Conflict Verification</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <div className="w-5 h-5 rounded-md bg-[#38BDF8]/40 flex items-center justify-center text-white flex-shrink-0">
                <Trophy size={12} className="text-[#38BDF8]" />
              </div>
              <span>Real-Time Slot Concurrency</span>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL (60% on desktop) */}
        <div className="lg:col-span-8 flex flex-col justify-center p-6 sm:p-8 bg-white/70">
          
          {/* Header */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-[#BFDBFE]/60 mb-2">
              <Sparkles size={12} className="text-[#2563EB]" />
              <span>Student & Admin Registration</span>
            </div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Create Your Profile
            </h1>
            <p className="text-xs text-[#52657A] mt-1 font-medium">
              Register with your institutional campus credentials to reserve grounds.
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-3 rounded-[12px] border border-[#FECACA] bg-[#FEE2E2]/80 backdrop-blur-xs p-3 text-xs font-semibold text-[#B91C1C] flex items-center gap-2.5 animate-scale-in shadow-xs">
              <AlertCircle size={16} className="flex-shrink-0 text-[#EF4444]" />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS ALERT */}
          {success && (
            <div className="mb-3 rounded-[12px] border border-[#A7F3D0] bg-[#DCFCE7]/80 backdrop-blur-xs p-3 text-xs font-semibold text-[#047857] flex items-center gap-2.5 animate-scale-in shadow-xs">
              <CheckCircle2 size={16} className="flex-shrink-0 text-[#10B981]" />
              <span>{success}</span>
            </div>
          )}

          {/* REGISTRATION FORM */}
          <form onSubmit={submit} className="space-y-3" aria-label="Register form">
            
            {/* ROW 1: PERSONAL & EMAIL */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block">Full Name</label>
                <div className="relative">
                  <input 
                    aria-label="Full name" 
                    autoComplete="name"
                    className="w-full h-[46px] pl-10 pr-3 text-sm font-semibold rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 focus:outline-none transition-all shadow-xs" 
                    placeholder="Aryan Kelkar" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block">Campus Email</label>
                <div className="relative">
                  <input 
                    aria-label="Email" 
                    autoComplete="email"
                    className="w-full h-[46px] pl-10 pr-3 text-sm font-semibold rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 focus:outline-none transition-all shadow-xs" 
                    placeholder={`yourname${ALLOWED_EMAIL_DOMAIN}`} 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                </div>
                {!isCollegeEmail && email && (
                  <p className="mt-1 text-[10px] font-bold text-[#EF4444]">Must end with {ALLOWED_EMAIL_DOMAIN}</p>
                )}
              </div>
            </div>

            {/* ROW 2: ROLL NUMBER & MOBILE NUMBER */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block">Roll Number</label>
                <div className="relative">
                  <input 
                    aria-label="Roll Number" 
                    className="w-full h-[46px] pl-10 pr-3 text-sm font-semibold uppercase rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 focus:outline-none transition-all shadow-xs" 
                    placeholder="24CS101" 
                    value={roll} 
                    onChange={(e) => setRoll(e.target.value.toUpperCase())} 
                    required={!isAdminEmail} 
                    disabled={isAdminEmail} 
                    maxLength={10} 
                  />
                  <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block">
                  Mobile Number {!isAdminEmail && <span className="text-[#EF4444]">*</span>}
                </label>
                <div className="relative">
                  <input 
                    aria-label="Mobile Number" 
                    type="tel"
                    autoComplete="tel"
                    className="w-full h-[46px] pl-10 pr-3 text-sm font-semibold rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 focus:outline-none transition-all shadow-xs" 
                    placeholder="9876543210" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required={!isAdminEmail} 
                    maxLength={15} 
                  />
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                </div>
                {phone && !isValidPhoneNumber(phone) && (
                  <p className="mt-1 text-[10px] font-bold text-[#EF4444]">Enter valid 10-digit mobile number</p>
                )}
              </div>
            </div>

            {/* ROW 3: ACADEMIC DETAILS */}
            <div className="grid gap-3 grid-cols-3">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block">Branch</label>
                <select 
                  aria-label="Branch" 
                  className="w-full h-[44px] px-2.5 text-xs font-bold rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 focus:outline-none transition-all" 
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
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block">Division</label>
                <select 
                  aria-label="Division" 
                  className="w-full h-[44px] px-2.5 text-xs font-bold rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 focus:outline-none transition-all" 
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
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block">Year</label>
                <select 
                  aria-label="Class Year" 
                  className="w-full h-[44px] px-2.5 text-xs font-bold rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 focus:outline-none transition-all" 
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

            {/* ROW 4: PASSWORD */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block">Password</label>
              <div className="relative">
                <input 
                  aria-label="Password" 
                  autoComplete="new-password"
                  className="w-full h-[46px] pl-10 pr-10 text-sm font-semibold rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 focus:outline-none transition-all shadow-xs" 
                  placeholder="Min 8 characters" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                <button 
                  type="button" 
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#2563EB] p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#2563EB]" 
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* HELPER BOX */}
            <div className="p-2.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B] font-semibold flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#2563EB] flex-shrink-0" />
              <span>Password requires 8+ characters for institutional ground access.</span>
            </div>

            {/* PRIMARY CTA BUTTON */}
            <button 
              aria-label="Submit registration" 
              className="relative group w-full h-[48px] rounded-[14px] text-sm font-extrabold text-white flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] hover:from-[#1D4ED8] hover:to-[#1E3A8A] active:scale-[0.99] shadow-[0_8px_20px_rgba(37,99,235,0.32)] hover:shadow-[0_10px_24px_rgba(37,99,235,0.4)] transition-all duration-200 overflow-hidden focus:outline-none focus:ring-4 focus:ring-[#2563EB]/25" 
              type="submit" 
              disabled={loading || !name || !isCollegeEmail || (!isAdminEmail && (!rollValid || !phoneValid || !branch || !division || !classYear)) || password.length < 8}
            >
              {/* Top Specular Sheen */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="text-white">Creating Profile...</span>
                </div>
              ) : (
                <>
                  <span className="text-white tracking-wide">Create Student Profile</span>
                  <ArrowRight size={17} className="text-white group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* SWITCH LINK */}
            <div className="pt-3 border-t border-[#E2E8F0] text-center text-xs font-semibold text-[#64748B]">
              <span>Already have an account? </span>
              <Link href="/login" className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-extrabold">
                Sign in →
              </Link>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}

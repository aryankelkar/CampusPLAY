import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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

  const isAdminEmail = email.trim().toLowerCase() === ADMIN_EMAIL;
  const isCollegeEmail = isValidCollegeEmail(email.trim().toLowerCase());
  const rollValid = isAdminEmail ? true : isValidRollNumber(roll.trim().toUpperCase());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isCollegeEmail) {
      setError(`Only official college emails ending with ${ALLOWED_EMAIL_DOMAIN} are allowed.`);
      return;
    }
    if (!isAdminEmail) {
      if (!rollValid) { setError('Invalid roll number. Must be alphanumeric (1-10 characters)'); return; }
      if (!branch || !division || !classYear) { setError('Branch, Division, and Class Year are required.'); return; }
    }
    // Password validation
    if (password.length < 8) { setError('Password must be at least 8 characters long'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[a-z]/.test(password)) { setError('Password must contain at least one lowercase letter'); return; }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one number'); return; }
    try {
      setLoading(true);
      await api.post('/auth/register', { name, email, password, roll, branch, division, classYear });
      setSuccess('✅ Account created successfully! Redirecting to login...');
      setTimeout(()=> router.push('/login'), 1500);
    } catch (err: any) {
      const data = err?.response?.data;
      const firstValidationMsg = Array.isArray(data?.errors) && data.errors.length > 0 ? data.errors[0].msg : '';
      setError(firstValidationMsg || data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-secondary-600 shadow-sm mb-4">
          <span className="text-3xl">🎓</span>
        </div>
        <h1 className="page-title mb-2">Create Account</h1>
        <p className="text-muted">Join CampusPlay with your @vit.edu.in email</p>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2 animate-fade-in">
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-secondary-200 bg-secondary-50 p-4 text-sm text-secondary-700 flex items-center gap-2 animate-fade-in">
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}
      <form onSubmit={submit} className="card p-6 space-y-5" aria-label="Register form">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label mb-2 block">👤 Full Name</label>
              <input 
                aria-label="Full name" 
                className="input" 
                placeholder="Enter your full name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="label mb-2 block">📧 Email Address</label>
              <input 
                aria-label="Email" 
                className="input" 
                placeholder="yourname@vit.edu.in" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              {!isCollegeEmail && email && (
                <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Use your official @vit.edu.in email</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label mb-2 block">🎫 Roll Number</label>
              <input 
                aria-label="Roll Number" 
                className="input" 
                placeholder="e.g., 2024CS001 or ABC123" 
                value={roll} 
                onChange={(e) => setRoll(e.target.value.toUpperCase())} 
                required={!isAdminEmail} 
                disabled={isAdminEmail} 
                maxLength={10} 
              />
              {!rollValid && !isAdminEmail && roll && (
                <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Alphanumeric only, max 10 characters</span>
                </div>
              )}
            </div>
            <div>
              <label className="label mb-2 block">🔒 Password</label>
              <div className="relative">
                <input 
                  aria-label="Password" 
                  className="input pr-20" 
                  placeholder="Min. 8 characters" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors" 
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label mb-2 block">🏛️ Branch</label>
              <select 
                aria-label="Branch" 
                className="input" 
                value={branch} 
                onChange={(e) => setBranch(e.target.value)} 
                required={!isAdminEmail} 
                disabled={isAdminEmail}
              >
                <option value="">Select Branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-2 block">🔢 Division</label>
              <select 
                aria-label="Division" 
                className="input" 
                value={division} 
                onChange={(e) => setDivision(e.target.value)} 
                required={!isAdminEmail} 
                disabled={isAdminEmail}
              >
                <option value="">Select Division</option>
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label mb-2 block">📅 Class Year</label>
              <select 
                aria-label="Class Year" 
                className="input" 
                value={classYear} 
                onChange={(e) => setClassYear(e.target.value)} 
                required={!isAdminEmail} 
                disabled={isAdminEmail}
              >
                <option value="">Select Year</option>
                {CLASS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
          <p className="text-xs text-gray-700 flex items-start gap-2">
            <span className="text-primary-600">💡</span>
            <span><strong>Note:</strong> Only VIT students can register (@vit.edu.in). Roll format: 24XX1C00XX. Password must be 8+ characters with uppercase, lowercase, and number.</span>
          </p>
        </div>
        
        <button 
          aria-label="Submit registration" 
          className="btn btn-secondary w-full py-3" 
          type="submit" 
          disabled={loading || !name || !isCollegeEmail || (!isAdminEmail && (!rollValid || !branch || !division || !classYear)) || password.length < 8}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner"></span>
              <span>Creating Account...</span>
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">Login here</Link>
        </p>
      </div>
    </div>
  );
}

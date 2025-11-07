import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../lib/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const isValidEmail = (email: string) => {
      const collegeDomain = '@vit.edu.in';
      return email.endsWith(collegeDomain) || email === 'admin@campusplay.com';
    };
    if (!isValidEmail(email)) {
      setError('❌ Please use your official college email (@vit.edu.in) to log in.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/login', { email, password });
      router.push('/bookings');
    } catch (err: any) {
      const data = err?.response?.data;
      const firstValidationMsg = Array.isArray(data?.errors) && data.errors.length > 0 ? data.errors[0].msg : '';
      setError(firstValidationMsg || data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl mb-4">
            <span className="text-4xl">🎾</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Sign in to your CampusPlay account</p>
        </div>
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2"><span>❌</span>{error}</div>}
        <form onSubmit={submit} className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-xl border border-gray-100 space-y-5" aria-label="Login form">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input aria-label="Email" className="input w-full" placeholder="yourname@vit.edu.in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input aria-label="Password" className="input w-full pr-16" placeholder="Enter your password" type={showPassword?'text':'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-medium" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button>
            </div>
          </div>
          <button aria-label="Submit login" className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" type="submit" disabled={loading || !email || !password}>{loading ? 'Signing in...' : 'Sign In'}</button>
          <div className="pt-2 space-y-1">
            <p className="text-center text-xs text-gray-500">💡 Only VIT emails allowed (e.g., yourname@vit.edu.in)</p>
            <p className="text-center text-xs text-gray-500">🔑 Admin login: admin@campusplay.com / admin123</p>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

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
      router.push('/');
    } catch (err: any) {
      const data = err?.response?.data;
      const firstValidationMsg = Array.isArray(data?.errors) && data.errors.length > 0 ? data.errors[0].msg : '';
      setError(firstValidationMsg || data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 shadow-sm mb-4">
            <span className="text-3xl">🎾</span>
          </div>
          <h1 className="page-title mb-2">Welcome Back!</h1>
          <p className="text-muted">Sign in to your CampusPlay account</p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2 animate-fade-in">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={submit} className="card p-6 space-y-5" aria-label="Login form">
          <div>
            <label className="label mb-2 block">Email Address</label>
            <input 
              aria-label="Email" 
              className="input" 
              placeholder="yourname@vit.edu.in" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="label mb-2 block">Password</label>
            <div className="relative">
              <input 
                aria-label="Password" 
                className="input pr-20" 
                placeholder="Enter your password" 
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
          <button 
            aria-label="Submit login" 
            className="btn btn-primary w-full py-3" 
            type="submit" 
            disabled={loading || !email || !password}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner"></span>
                <span>Signing in...</span>
              </span>
            ) : (
              'Sign In'
            )}
          </button>
          <div className="pt-2 space-y-1.5 border-t border-gray-200">
            <p className="text-center text-xs text-muted flex items-center justify-center gap-1">
              <span>💡</span>
              <span>Only VIT emails allowed (e.g., yourname@vit.edu.in)</span>
            </p>
            <p className="text-center text-xs text-muted flex items-center justify-center gap-1">
              <span>🔑</span>
              <span>Admin login: admin@campusplay.com / admin123</span>
            </p>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

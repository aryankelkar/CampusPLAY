import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import PageHeader from '../components/common/PageHeader';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="mx-auto max-w-md">
      <PageHeader title="Login" subtitle="Welcome back 👋 Ready to book your next match?" />
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="card space-y-4 p-4" aria-label="Login form">
        <input aria-label="Email" className="input" placeholder="example@vit.edu.in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input aria-label="Password" className="input" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button aria-label="Submit login" className="btn btn-primary w-full disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        <p className="text-center text-xs text-gray-600">Only VIT emails are allowed — e.g. aryan.kelkar@vit.edu.in</p>
        <p className="text-center text-sm text-gray-600">Admin? Use admin@campusplay.com / admin123</p>
      </form>
    </div>
  );
}

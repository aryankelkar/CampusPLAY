import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import PageHeader from '../components/common/PageHeader';

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const isValidEmail = (email: string) => {
      const collegeDomain = '@vit.edu.in';
      return email.endsWith(collegeDomain) || email === 'admin@campusplay.com';
    };
    if (!isValidEmail(email)) {
      setError('Only official college emails ending with @vit.edu.in are allowed.');
      return;
    }
    if (email !== 'admin@campusplay.com') {
      if (!roll) { setError('Roll number is required.'); return; }
      if (!branch || !division || !classYear) { setError('Branch, Division, and Class Year are required.'); return; }
    }
    try {
      setLoading(true);
      await api.post('/auth/register', { name, email, password, roll, branch, division, classYear });
      setSuccess('✅ Account created successfully! You can now log in using your VIT email.');
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
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Create an account" subtitle="Use your @vit.edu.in email and roll number" />
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">{success}</div>}
      <form onSubmit={submit} className="card p-4 space-y-4" aria-label="Register form">
        <div className="grid gap-3 md:grid-cols-2">
          <input aria-label="Full name" className="input" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input aria-label="Email" className="input" placeholder="yourname@vit.edu.in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input aria-label="Roll Number" className="input" placeholder="e.g., 24XX1C00XX" value={roll} onChange={(e) => setRoll(e.target.value.toUpperCase())} required={email !== 'admin@campusplay.com'} />
          <input aria-label="Password" className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <select aria-label="Branch" className="input" value={branch} onChange={(e)=>setBranch(e.target.value)} required={email !== 'admin@campusplay.com'}>
            <option value="">Select Branch</option>
            <option>INFT</option>
            <option>CMPN</option>
            <option>EXTC</option>
            <option>EXCS</option>
            <option>BIOMED</option>
          </select>
          <select aria-label="Division" className="input" value={division} onChange={(e)=>setDivision(e.target.value)} required={email !== 'admin@campusplay.com'}>
            <option value="">Select Division</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
          <select aria-label="Class Year" className="input" value={classYear} onChange={(e)=>setClassYear(e.target.value)} required={email !== 'admin@campusplay.com'}>
            <option value="">Select Year</option>
            <option>FE</option>
            <option>SE</option>
            <option>TE</option>
            <option>BE</option>
          </select>
        </div>
        <div className="text-xs text-gray-600">
          Only valid VIT student emails allowed. Roll format: 24XX1C00XX.
        </div>
        <button aria-label="Submit registration" className="btn btn-primary w-full disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
      </form>
    </div>
  );
}

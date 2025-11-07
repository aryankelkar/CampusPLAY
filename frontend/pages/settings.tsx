import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import PageHeader from '../components/common/PageHeader';
import api from '../lib/api';

const BRANCHES = ['INFT','CMPN','EXTC','EXCS','BIOMED'];
const DIVISIONS = ['A','B','C','D'];
const YEARS = ['FE','SE','TE','BE'];

type Tab = 'profile' | 'security' | 'preferences';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <PageHeader title="Settings" subtitle="Manage your profile and security" />
        <Settings />
      </div>
    </ProtectedRoute>
  );
}

function Settings() {
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<any>(null);
  const [toast, setToast] = useState<string>('');

  // profile form state
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [division, setDivision] = useState('');
  const [classYear, setClassYear] = useState('');

  // security form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/user/profile');
        const u = data?.data?.user;
        setMe(u);
        setName(u?.name || '');
        setBranch(u?.branch || '');
        setDivision(u?.division || '');
        setClassYear(u?.classYear || '');
        // Fallback: if academic fields missing, try to infer from latest booking snapshot
        if ((!u?.branch || !u?.division || !u?.classYear) && u?.role === 'student') {
          try {
            const { data: bookingsData } = await api.get('/bookings');
            const bookings = bookingsData?.data?.bookings || [];
            if (bookings.length > 0) {
              const latest = bookings[0];
              setBranch((prev) => prev || latest?.branch || latest?.student?.branch || '');
              setDivision((prev) => prev || latest?.division || latest?.student?.division || '');
              setClassYear((prev) => prev || latest?.classYear || latest?.student?.classYear || '');
            }
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const changed = useMemo(() => {
    if (!me) return false;
    return name !== me.name || branch !== me.branch || division !== me.division || classYear !== me.classYear;
  }, [me, name, branch, division, classYear]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      await api.put('/user/update', { name, branch, division, classYear });
      setToast('✅ Profile updated successfully!');
      setTimeout(()=> setToast(''), 2000);
      // refresh me
      const { data } = await api.get('/user/profile');
      const u = data?.data?.user; setMe(u);
    } finally {
      setSaving(false);
    }
  };

  const passwordValid = useMemo(() => {
    if (newPassword.length < 8) return false;
    if (!/[A-Z]/.test(newPassword)) return false;
    if (!/[a-z]/.test(newPassword)) return false;
    if (!/[0-9]/.test(newPassword)) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  }, [newPassword, confirmPassword]);

  const changePassword = async () => {
    try {
      setSaving(true);
      const { data } = await api.post('/user/change-password', { currentPassword, newPassword });
      setToast('✅ Password updated successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(()=> setToast(''), 2000);
      return data;
    } catch (err: any) {
      setToast('⚠️ Incorrect current password');
      setTimeout(()=> setToast(''), 2000);
    } finally { setSaving(false); }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[220px,1fr]">
      {toast && (
        <div className="fixed right-4 top-20 z-50 rounded-lg bg-green-600 px-3 py-2 text-sm text-white shadow">{toast}</div>
      )}
      {/* Sidebar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          {(['profile','security','preferences'] as Tab[]).map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`w-full text-left rounded-lg px-3 py-2 transition ${tab===t?'bg-blue-50 text-blue-700':'hover:bg-gray-50'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Panel */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm min-h-[360px]">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-1/3 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
        ) : (
          <div className="transition-opacity duration-300">
            {tab === 'profile' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <input className="input mt-1" value={name} onChange={(e)=>setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input className="input mt-1" value={me?.email||''} readOnly />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Roll Number</label>
                    <input className="input mt-1" value={me?.roll||''} readOnly />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Branch</label>
                    <select className="input mt-1" value={branch} onChange={(e)=>setBranch(e.target.value)}>
                      <option value="">Select</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Division</label>
                    <select className="input mt-1" value={division} onChange={(e)=>setDivision(e.target.value)}>
                      <option value="">Select</option>
                      {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Class Year</label>
                    <select className="input mt-1" value={classYear} onChange={(e)=>setClassYear(e.target.value)}>
                      <option value="">Select</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="btn" style={{ background:'#3B82F6', color:'#fff' }} disabled={!changed || saving} onClick={saveProfile}>Save Changes</button>
                  <button className="btn btn-ghost border border-gray-300" disabled={!changed || saving} onClick={()=>{ setName(me?.name||''); setBranch(me?.branch||''); setDivision(me?.division||''); setClassYear(me?.classYear||''); }}>Cancel</button>
                </div>
              </div>
            )}

            {tab === 'security' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Current Password</label>
                    <input className="input mt-1" type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">New Password</label>
                    <input className="input mt-1" type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
                    <div className="text-xs text-gray-500 mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <input className="input mt-1" type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <button className="btn" style={{ background:'linear-gradient(90deg,#22C55E,#16A34A)', color:'#fff' }} disabled={!passwordValid || saving} onClick={changePassword}>Update Password</button>
              </div>
            )}

            {tab === 'preferences' && (
              <div className="space-y-4">
                <Toggle label="Dark Mode" storageKey="pref.dark" />
                <Toggle label="Compact Layout" storageKey="pref.compact" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, storageKey }: { label: string; storageKey: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const v = localStorage.getItem(storageKey);
    if (v) setOn(v === '1');
  }, [storageKey]);
  const toggle = () => {
    const v = !on; setOn(v); localStorage.setItem(storageKey, v ? '1' : '0');
  };
  return (
    <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <span>{label}</span>
      <button type="button" onClick={toggle} className={`h-6 w-11 rounded-full p-0.5 transition ${on?'bg-blue-600':'bg-gray-300'}`}>
        <span className={`h-5 w-5 rounded-full bg-white shadow transition ${on?'translate-x-5':''}`} />
      </button>
    </label>
  );
}

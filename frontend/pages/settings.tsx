import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import PageHeader from '../components/common/PageHeader';
import api from '../lib/api';
import { BRANCHES, DIVISIONS, CLASS_YEARS } from '../constants';

type Tab = 'profile' | 'security' | 'preferences';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl mb-4">
            <span className="text-4xl">⚙️</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your profile, security and preferences</p>
        </div>
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
    <div className="space-y-6">
      {toast && <div className="fixed right-4 top-20 z-50 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-sm text-white shadow-xl flex items-center gap-2"><span>✅</span>{toast}</div>}
      
      {/* Tab Navigation */}
      <div className="rounded-2xl bg-white/90 backdrop-blur p-2 shadow-md border border-gray-100">
        <div className="flex gap-2">
          <button 
            className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              tab === 'profile' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-50'
            }`} 
            onClick={()=>setTab('profile')}
          >
            👤 Profile
          </button>
          <button 
            className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              tab === 'security' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-50'
            }`} 
            onClick={()=>setTab('security')}
          >
            🔒 Security
          </button>
          <button 
            className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              tab === 'preferences' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-50'
            }`} 
            onClick={()=>setTab('preferences')}
          >
            🎨 Preferences
          </button>
        </div>
      </div>

      {/* Panel */}
      {loading ? (
        <div className="rounded-2xl bg-white/90 backdrop-blur p-12 shadow-xl border border-gray-100 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your settings...</p>
        </div>
      ) : (
        <>
          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-xl border border-gray-100">
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
                      {CLASS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="btn" style={{ background:'#3B82F6', color:'#fff' }} disabled={!changed || saving} onClick={saveProfile}>Save Changes</button>
                  <button className="btn btn-ghost border border-gray-300" disabled={!changed || saving} onClick={()=>{ setName(me?.name||''); setBranch(me?.branch||''); setDivision(me?.division||''); setClassYear(me?.classYear||''); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-xl border border-gray-100">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Current Password</label>
                    <input className="input mt-1 w-full" type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">New Password</label>
                    <input className="input mt-1 w-full" type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="Enter new password" />
                    <div className="text-xs text-gray-500 mt-1.5">Min 8 characters</div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Confirm New Password</label>
                    <input className="input mt-1 w-full" type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                  </div>
                </div>
                <button className="mt-6 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" disabled={!passwordValid || saving} onClick={changePassword}>
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {tab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-xl border border-gray-100">
                <div className="space-y-4">
                  <Toggle label="Dark Mode" storageKey="pref.dark" />
                  <Toggle label="Compact Layout" storageKey="pref.compact" />
                </div>
              </div>
            </div>
          )}
        </>
      )}
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

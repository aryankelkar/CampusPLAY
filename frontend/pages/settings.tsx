import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import { FormSkeleton } from '../components/common/LoadingSkeleton';
import api from '../lib/api';
import { BRANCHES, DIVISIONS, CLASS_YEARS } from '../constants';
import { useSocket } from '../context/SocketContext';

function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

function calculatePasswordStrength(password: string): { strength: number; label: string; color: 'red'|'orange'|'yellow'|'green'|'gray' } {
  if (!password) return { strength: 0, label: 'No password', color: 'gray' };
  let s = 0;
  if (password.length >= 8) s += 25; if (password.length >= 12) s += 15; if (password.length >= 16) s += 10;
  if (/[a-z]/.test(password)) s += 15;
  if (/[A-Z]/.test(password)) s += 15;
  if (/[0-9]/.test(password)) s += 15;
  if (/[^a-zA-Z0-9]/.test(password)) s += 15;
  if (/^[a-zA-Z]+$/.test(password)) s -= 10;
  if (/^[0-9]+$/.test(password)) s -= 10;
  if (/(.)\1{2,}/.test(password)) s -= 10;
  s = Math.max(0, Math.min(100, s));
  if (s < 40) return { strength: s, label: 'Weak', color: 'red' };
  if (s < 60) return { strength: s, label: 'Fair', color: 'orange' };
  if (s < 80) return { strength: s, label: 'Good', color: 'yellow' };
  return { strength: s, label: 'Strong', color: 'green' };
}

type Tab = 'profile' | 'security' | 'preferences' | 'account';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 shadow-sm mb-4">
            <span className="text-3xl">⚙️</span>
          </div>
          <h1 className="page-title mb-2">Settings</h1>
          <p className="text-muted">Manage your profile, security and preferences</p>
        </div>
        <Settings />
      </div>
    </ProtectedRoute>
  );
}

function Settings() {
  const { socket } = useSocket();
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<any>(null);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // profile form state
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [division, setDivision] = useState('');
  const [classYear, setClassYear] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [bookingStats, setBookingStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  // security form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);

  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

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
        setPhone(u?.phone || '');
        setBio(u?.bio || '');
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
        try {
          const { data: bookingsResp } = await api.get('/bookings');
          const list = bookingsResp?.data?.bookings || [];
          const sorted = [...list].sort((a: any, b: any) => (a.date === b.date ? (b.time || '').localeCompare(a.time || '') : (b.date || '').localeCompare(a.date || '')));
          setRecent(sorted.slice(0, 5));
          const totals = { total: list.length, approved: 0, pending: 0, rejected: 0, cancelled: 0 } as Record<string, number>;
          const sport: Record<string, number> = {};
          const ground: Record<string, number> = {};
          for (const b of list) {
            const s = String(b.status || '').toLowerCase();
            if (s in totals) totals[s]++;
            if (b.game) sport[b.game] = (sport[b.game] || 0) + 1;
            if (b.ground) ground[b.ground] = (ground[b.ground] || 0) + 1;
          }
          const most = (obj: Record<string, number>) => Object.keys(obj).reduce((a, c) => (obj[a] || 0) >= obj[c] ? a : c, Object.keys(obj)[0] || 'N/A');
          setBookingStats({
            total: totals.total,
            approved: totals.approved,
            pending: totals.pending,
            rejected: totals.rejected,
            cancelled: totals.cancelled,
            uniqueSports: Object.keys(sport).length,
            uniqueGrounds: Object.keys(ground).length,
            mostSport: Object.keys(sport).length ? most(sport) : 'N/A',
            mostGround: Object.keys(ground).length ? most(ground) : 'N/A',
          });
        } catch {}
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) {
          // Session expired or not authenticated
          window.location.href = '/login';
          return;
        }
        // For other errors, keep page but show minimal fallback state
        setMe(null);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Real-time updates for profile changes
    if (socket) {
      socket.on('profile:updated', (data: any) => {
        if (data?.user) {
          setMe(data.user);
          setName(data.user.name || '');
          setBranch(data.user.branch || '');
          setDivision(data.user.division || '');
          setClassYear(data.user.classYear || '');
          setToast({message: '✨ Profile updated in real-time', type: 'success'});
          setTimeout(() => setToast(null), 2000);
        }
      });

      return () => {
        socket.off('profile:updated');
      };
    }
  }, [socket]);

  const changed = useMemo(() => {
    if (!me) return false;
    return (
      name !== me.name ||
      branch !== me.branch ||
      division !== me.division ||
      classYear !== me.classYear ||
      phone !== (me.phone || '') ||
      bio !== (me.bio || '')
    );
  }, [me, name, branch, division, classYear, phone, bio]);

  const handleTabChange = (next: Tab) => {
    if (tab === 'profile' && changed) {
      setPendingTab(next);
      setShowUnsavedWarning(true);
      return;
    }
    setTab(next);
  };

  const confirmTabChange = () => {
    setShowUnsavedWarning(false);
    if (pendingTab) setTab(pendingTab);
    setPendingTab(null);
  };

  const cancelTabChange = () => {
    setShowUnsavedWarning(false);
    setPendingTab(null);
  };

  const saveProfile = async () => {
    if (phone && !validatePhone(phone)) {
      setToast({message: '⚠️ Invalid phone number. Must be 10 digits starting with 6-9', type: 'error'});
      setTimeout(()=> setToast(null), 3000);
      return;
    }
    try {
      setSaving(true);
      await api.put('/user/update', { name, phone, bio, branch, division, classYear });
      setToast({message: '✅ Profile updated successfully!', type: 'success'});
      setTimeout(()=> setToast(null), 2000);
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
    if (!passwordValid) {
      setToast({message: '⚠️ Please check password requirements', type: 'error'});
      setTimeout(()=> setToast(null), 3000);
      return;
    }
    try {
      setSaving(true);
      const { data } = await api.post('/user/change-password', { currentPassword, newPassword });
      setToast({message: '✅ Password updated successfully!', type: 'success'});
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(()=> setToast(null), 3000);
      return data;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Incorrect current password';
      setToast({message: `⚠️ ${errorMessage}`, type: 'error'});
      setTimeout(()=> setToast(null), 4000);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed right-4 top-20 z-50 rounded-lg px-6 py-4 text-sm text-white shadow-2xl flex items-center gap-2 animate-slide-in-right ${
          toast.type === 'success' ? 'bg-secondary-600' : 'bg-red-600'
        }`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}
      
      {/* Tab Navigation */}
      {showUnsavedWarning && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" onClick={cancelTabChange} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="modal-content max-w-md w-full p-6 animate-scale-in">
              <h3 className="text-lg font-bold text-primary-900 mb-2">⚠️ Unsaved Changes</h3>
              <p className="text-gray-700 mb-6">You have unsaved changes in your profile. Do you want to leave without saving?</p>
              <div className="flex gap-3">
                <button className="btn btn-outline flex-1" onClick={cancelTabChange}>Stay Here</button>
                <button className="btn btn-primary flex-1" onClick={confirmTabChange}>Leave Anyway</button>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="card p-2 sticky top-20 z-10 bg-white/90 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button 
            className={`flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-150 whitespace-nowrap ${
              tab === 'profile' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`} 
            onClick={()=>handleTabChange('profile')}
          >
            👤 Profile
          </button>
          <button 
            className={`flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-150 whitespace-nowrap ${
              tab === 'security' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`} 
            onClick={()=>handleTabChange('security')}
          >
            🔒 Security
          </button>
          <button 
            className={`flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-150 whitespace-nowrap ${
              tab === 'preferences' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`} 
            onClick={()=>handleTabChange('preferences')}
          >
            🎨 Preferences
          </button>
          <button 
            className={`flex-1 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-150 whitespace-nowrap ${
              tab === 'account' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`} 
            onClick={()=>handleTabChange('account')}
          >
            📊 Account Info
          </button>
        </div>
      </div>

      {/* Panel */}
      {loading ? (
        <FormSkeleton />
      ) : (
        <>
          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="card p-4 group relative">
                  <div className="text-sm text-muted mb-1">📧 Email</div>
                  <div className="font-semibold text-primary-900 truncate pr-8">{me?.email || 'N/A'}</div>
                  {me?.email && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(me.email); setToast({message: '📧 Email copied!', type: 'success'}); setTimeout(() => setToast(null), 2000); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-primary-50"
                      title="Copy email"
                    >
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                  )}
                </div>
                <div className="card p-4 group relative">
                  <div className="text-sm text-muted mb-1">🎓 Roll Number</div>
                  <div className="font-semibold text-primary-900 pr-8">{me?.roll || 'N/A'}</div>
                  {me?.roll && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(me.roll); setToast({message: '🎓 Roll number copied!', type: 'success'}); setTimeout(() => setToast(null), 2000); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-primary-50"
                      title="Copy roll number"
                    >
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                  )}
                </div>
                <div className="card p-4">
                  <div className="text-sm text-muted mb-1">📅 Member Since</div>
                  <div className="font-semibold text-primary-900">{me?.createdAt ? new Date(me.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="label mb-2 block">Full Name</label>
                    <input className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter your full name" />
                  </div>
                  <div>
                    <label className="label mb-2 block">Phone Number</label>
                    <input className="input" type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="10 digit mobile number" />
                    {phone && !validatePhone(phone) && (
                      <p className="text-xs text-red-600 mt-1">Invalid phone. Must be 10 digits starting with 6-9.</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="label mb-2 block">Bio / About Me</label>
                    <textarea className="input min-h-[90px]" maxLength={200} value={bio} onChange={(e)=>setBio(e.target.value)} placeholder="Tell us about yourself (max 200 characters)" />
                    <div className="text-xs text-muted mt-1">{bio.length}/200</div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Academic Details</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="label mb-2 block">Branch</label>
                    <select className="input" value={branch} onChange={(e)=>setBranch(e.target.value)}>
                      <option value="">Select Branch</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label mb-2 block">Division</label>
                    <select className="input" value={division} onChange={(e)=>setDivision(e.target.value)}>
                      <option value="">Select Division</option>
                      {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label mb-2 block">Class Year</label>
                    <select className="input" value={classYear} onChange={(e)=>setClassYear(e.target.value)}>
                      <option value="">Select Year</option>
                      {CLASS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button className="btn btn-primary" disabled={!changed || saving || (!!phone && !validatePhone(phone))} onClick={saveProfile}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn btn-outline" disabled={!changed || saving} onClick={()=>{ setName(me?.name||''); setBranch(me?.branch||''); setDivision(me?.division||''); setClassYear(me?.classYear||''); setPhone(me?.phone||''); setBio(me?.bio||''); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label mb-2 block">Current Password</label>
                    <input className="input" type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className="label mb-2 block">New Password</label>
                    <input className="input" type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="Enter new password" autoComplete="new-password" />
                    {newPassword && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">Password Strength:</span>
                          <span className={`text-xs font-bold ${
                            passwordStrength.color === 'red' ? 'text-red-600' :
                            passwordStrength.color === 'orange' ? 'text-orange-600' :
                            passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>{passwordStrength.label}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${
                            passwordStrength.color === 'red' ? 'bg-red-500' :
                            passwordStrength.color === 'orange' ? 'bg-orange-500' :
                            passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} style={{ width: `${passwordStrength.strength}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="text-xs mt-2 space-y-1">
                      <div className={newPassword.length >= 8 ? 'text-green-600' : 'text-muted'}>
                        {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                      </div>
                      <div className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-muted'}>
                        {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
                      </div>
                      <div className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-muted'}>
                        {/[a-z]/.test(newPassword) ? '✓' : '○'} One lowercase letter
                      </div>
                      <div className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-muted'}>
                        {/[0-9]/.test(newPassword) ? '✓' : '○'} One number
                      </div>
                      <div className={/[^a-zA-Z0-9]/.test(newPassword) ? 'text-green-600' : 'text-muted'}>
                        {/[^a-zA-Z0-9]/.test(newPassword) ? '✓' : '○'} Special character (recommended)
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="label mb-2 block">Confirm New Password</label>
                    <input className="input" type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                    {confirmPassword && (
                      <p className={`text-xs mt-2 ${
                        newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button 
                    className="btn btn-primary" 
                    disabled={!currentPassword || !passwordValid || saving} 
                    onClick={changePassword}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                  {!passwordValid && (newPassword || confirmPassword) && (
                    <p className="text-xs text-red-600 mt-2">
                      Please ensure all password requirements are met
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {tab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Display Preferences</h3>
                <div className="space-y-4">
                  <Toggle label="Dark Mode" storageKey="pref.dark" />
                  <Toggle label="Compact Layout" storageKey="pref.compact" />
                </div>
                <p className="text-xs text-muted mt-4 pt-4 border-t border-gray-200">
                  💡 These preferences are saved locally in your browser
                </p>
              </div>
            </div>
          )}
          {tab === 'account' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="card p-4 text-center">
                  <div className="text-xs text-muted mb-1">Total</div>
                  <div className="text-2xl font-bold">{bookingStats?.total ?? 0}</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-xs text-muted mb-1">Approved</div>
                  <div className="text-2xl font-bold text-green-600">{bookingStats?.approved ?? 0}</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-xs text-muted mb-1">Pending</div>
                  <div className="text-2xl font-bold text-amber-600">{bookingStats?.pending ?? 0}</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-xs text-muted mb-1">Rejected</div>
                  <div className="text-2xl font-bold text-red-600">{bookingStats?.rejected ?? 0}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-primary mb-3">Recent Activity</h3>
                  <div className="space-y-3">
                    {recent.length === 0 ? (
                      <div className="text-sm text-muted">No recent bookings</div>
                    ) : (
                      recent.map((b: any) => (
                        <div key={b._id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                          <div className="text-sm font-medium">{b.game} @ {b.ground}</div>
                          <div className="text-xs text-muted">{b.date} · {b.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-primary mb-3">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Unique Sports</span><span className="font-semibold">{bookingStats?.uniqueSports ?? 0}</span></div>
                    <div className="flex justify-between"><span>Unique Grounds</span><span className="font-semibold">{bookingStats?.uniqueGrounds ?? 0}</span></div>
                    <div className="flex justify-between"><span>Most Played Sport</span><span className="font-semibold">{bookingStats?.mostSport ?? 'N/A'}</span></div>
                    <div className="flex justify-between"><span>Most Used Ground</span><span className="font-semibold">{bookingStats?.mostGround ?? 'N/A'}</span></div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Link href="/bookings" className="btn btn-primary flex-1">Book New</Link>
                    <Link href="/history" className="btn btn-secondary flex-1">View History</Link>
                  </div>
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
    <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors cursor-pointer">
      <span className="font-medium text-gray-700">{label}</span>
      <button type="button" onClick={toggle} className={`h-6 w-11 rounded-full p-0.5 transition-all duration-200 ${on?'bg-primary-600':'bg-gray-300'}`}>
        <span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on?'translate-x-5':''}`} />
      </button>
    </label>
  );
}

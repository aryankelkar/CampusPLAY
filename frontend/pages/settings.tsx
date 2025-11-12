import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import { FormSkeleton } from '../components/common/LoadingSkeleton';
import api from '../lib/api';
import { BRANCHES, DIVISIONS, CLASS_YEARS } from '../constants';
import { useSocket } from '../context/SocketContext';

type Tab = 'profile' | 'security' | 'preferences' | 'account';

// Helper functions for statistics
function getMostBookedSport(bookings: any[]) {
  if (!bookings.length) return 'N/A';
  const counts: Record<string, number> = {};
  bookings.forEach(b => counts[b.game] = (counts[b.game] || 0) + 1);
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

function getMostBookedGround(bookings: any[]) {
  if (!bookings.length) return 'N/A';
  const counts: Record<string, number> = {};
  bookings.forEach(b => counts[b.ground] = (counts[b.ground] || 0) + 1);
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone);
}

// Password strength calculator
function calculatePasswordStrength(password: string): { strength: number; label: string; color: string } {
  if (!password) return { strength: 0, label: 'No password', color: 'gray' };
  
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;
  if (password.length >= 16) strength += 10;
  
  // Character variety
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15; // Special chars
  
  // Common patterns (reduce strength)
  if (/^[a-zA-Z]+$/.test(password)) strength -= 10; // Only letters
  if (/^[0-9]+$/.test(password)) strength -= 10; // Only numbers
  if (/(.)\1{2,}/.test(password)) strength -= 10; // Repeated chars
  
  strength = Math.max(0, Math.min(100, strength));
  
  if (strength < 40) return { strength, label: 'Weak', color: 'red' };
  if (strength < 60) return { strength, label: 'Fair', color: 'orange' };
  if (strength < 80) return { strength, label: 'Good', color: 'yellow' };
  return { strength, label: 'Strong', color: 'green' };
}

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
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [branch, setBranch] = useState('');
  const [division, setDivision] = useState('');
  const [classYear, setClassYear] = useState('');
  
  // booking statistics
  const [bookingStats, setBookingStats] = useState<any>(null);

  // security form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  
  // Password strength
  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/user/profile');
        const u = data?.data?.user;
        setMe(u);
        setName(u?.name || '');
        setPhone(u?.phone || '');
        setBio(u?.bio || '');
        setBranch(u?.branch || '');
        setDivision(u?.division || '');
        setClassYear(u?.classYear || '');
        
        // Load booking statistics
        try {
          const { data: bookingsData } = await api.get('/bookings');
          const bookings = bookingsData?.data?.bookings || [];
          const stats = {
            total: bookings.length,
            approved: bookings.filter((b: any) => b.status === 'Approved').length,
            pending: bookings.filter((b: any) => b.status === 'Pending').length,
            rejected: bookings.filter((b: any) => b.status === 'Rejected').length,
            cancelled: bookings.filter((b: any) => b.status === 'Cancelled').length,
            sports: [...new Set(bookings.map((b: any) => b.game))].length,
            grounds: [...new Set(bookings.map((b: any) => b.ground))].length,
            mostBookedSport: getMostBookedSport(bookings),
            mostBookedGround: getMostBookedGround(bookings),
            recentBookings: bookings.slice(0, 5)
          };
          setBookingStats(stats);
        } catch {}
        
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

    // Real-time updates for profile changes
    if (socket) {
      socket.on('profile:updated', (data: any) => {
        if (data?.user) {
          setMe(data.user);
          setName(data.user.name || '');
          setPhone(data.user.phone || '');
          setBio(data.user.bio || '');
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
    return name !== me.name || phone !== (me.phone || '') || bio !== (me.bio || '') || branch !== me.branch || division !== me.division || classYear !== me.classYear;
  }, [me, name, phone, bio, branch, division, classYear]);

  // Handle tab change with unsaved warning
  const handleTabChange = (newTab: Tab) => {
    if (changed && tab === 'profile') {
      setPendingTab(newTab);
      setShowUnsavedWarning(true);
    } else {
      setTab(newTab);
    }
  };

  const confirmTabChange = () => {
    setShowUnsavedWarning(false);
    if (pendingTab) {
      setTab(pendingTab);
      setPendingTab(null);
    }
  };

  const cancelTabChange = () => {
    setShowUnsavedWarning(false);
    setPendingTab(null);
  };

  const saveProfile = async () => {
    // Validate phone if provided
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
      
      {/* Unsaved Changes Warning Modal */}
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

      {/* Tab Navigation */}
      <div className="card p-2 sticky top-20 z-10 bg-white/95 backdrop-blur">
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
              {/* Account Info Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="card p-4 group relative">
                  <div className="text-sm text-muted mb-1">📧 Email</div>
                  <div className="font-semibold text-primary-900 truncate pr-8">{me?.email || 'N/A'}</div>
                  {me?.email && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(me.email);
                        setToast({message: '📧 Email copied!', type: 'success'});
                        setTimeout(() => setToast(null), 2000);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-primary-50"
                      title="Copy email"
                    >
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="card p-4 group relative">
                  <div className="text-sm text-muted mb-1">🎓 Roll Number</div>
                  <div className="font-semibold text-primary-900 pr-8">{me?.roll || 'N/A'}</div>
                  {me?.roll && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(me.roll);
                        setToast({message: '🎓 Roll number copied!', type: 'success'});
                        setTimeout(() => setToast(null), 2000);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-primary-50"
                      title="Copy roll number"
                    >
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="card p-4">
                  <div className="text-sm text-muted mb-1">📅 Member Since</div>
                  <div className="font-semibold text-primary-900">
                    {me?.createdAt ? new Date(me.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Editable Information */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="label mb-2 block">Full Name *</label>
                    <input 
                      className="input" 
                      value={name} 
                      onChange={(e)=>setName(e.target.value)}
                      placeholder="Enter your full name"
                      autoFocus
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="label mb-2 block">Phone Number</label>
                    <input 
                      className="input" 
                      type="tel"
                      value={phone} 
                      onChange={(e)=>setPhone(e.target.value)}
                      placeholder="10 digit mobile number"
                      maxLength={10}
                    />
                    <p className="text-xs text-muted mt-1">Indian mobile number (10 digits)</p>
                  </div>
                  <div>
                    <label className="label mb-2 block">Role</label>
                    <input 
                      className="input bg-gray-50 capitalize" 
                      value={me?.role || 'Student'} 
                      readOnly 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label mb-2 block">Bio / About Me</label>
                    <textarea 
                      className="input resize-none" 
                      rows={3}
                      value={bio} 
                      onChange={(e)=>setBio(e.target.value.slice(0, 200))}
                      placeholder="Tell us a little about yourself (optional, max 200 characters)"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted mt-1 text-right">{bio.length}/200</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
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
              </div>

              {/* Save Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="btn btn-primary flex-1" disabled={!changed || saving} onClick={saveProfile}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button 
                  className="btn btn-outline" 
                  disabled={!changed || saving} 
                  onClick={()=>{ 
                    setName(me?.name||''); 
                    setPhone(me?.phone||''); 
                    setBio(me?.bio||''); 
                    setBranch(me?.branch||''); 
                    setDivision(me?.division||''); 
                    setClassYear(me?.classYear||''); 
                  }}
                >
                  ↺ Cancel
                </button>
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
                    <input 
                      className="input" 
                      type="password" 
                      value={newPassword} 
                      onChange={(e)=>setNewPassword(e.target.value)} 
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />
                    
                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">Password Strength:</span>
                          <span className={`text-xs font-bold ${
                            passwordStrength.color === 'red' ? 'text-red-600' :
                            passwordStrength.color === 'orange' ? 'text-orange-600' :
                            passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              passwordStrength.color === 'red' ? 'bg-red-500' :
                              passwordStrength.color === 'orange' ? 'bg-orange-500' :
                              passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          />
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

          {/* Account Info Tab */}
          {tab === 'account' && (
            <div className="space-y-6 animate-fade-in">
              {/* Account Summary */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Account Summary</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
                    <div className="text-4xl">👤</div>
                    <div>
                      <div className="text-sm text-muted">Account Type</div>
                      <div className="font-semibold text-primary-900 capitalize">{me?.role || 'Student'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-4xl">✉️</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-muted">Email Address</div>
                      <div className="font-semibold text-primary-900 truncate">{me?.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Statistics */}
              {bookingStats && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-primary mb-4">📊 Booking Statistics</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{bookingStats.total}</div>
                      <div className="text-sm text-muted mt-1">Total Bookings</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{bookingStats.approved}</div>
                      <div className="text-sm text-muted mt-1">Approved</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-600">{bookingStats.pending}</div>
                      <div className="text-sm text-muted mt-1">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">{bookingStats.rejected}</div>
                      <div className="text-sm text-muted mt-1">Rejected</div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-muted mb-2">🏆 Most Booked Sport</div>
                      <div className="font-semibold text-primary-900">{bookingStats.mostBookedSport}</div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-muted mb-2">🏟️ Most Booked Ground</div>
                      <div className="font-semibold text-primary-900">{bookingStats.mostBookedGround}</div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-muted mb-2">🎯 Unique Sports</div>
                      <div className="font-semibold text-primary-900">{bookingStats.sports} {bookingStats.sports === 1 ? 'Sport' : 'Sports'}</div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-muted mb-2">📍 Unique Grounds</div>
                      <div className="font-semibold text-primary-900">{bookingStats.grounds} {bookingStats.grounds === 1 ? 'Ground' : 'Grounds'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {bookingStats && bookingStats.recentBookings && bookingStats.recentBookings.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-primary mb-4">🕐 Recent Bookings</h3>
                  <div className="space-y-3">
                    {bookingStats.recentBookings.map((booking: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium text-primary-900">{booking.game} @ {booking.ground}</div>
                          <div className="text-sm text-muted">{booking.date} • {booking.time}</div>
                        </div>
                        <span className={`badge ${
                          booking.status === 'Approved' ? 'badge-green' : 
                          booking.status === 'Pending' ? 'badge-yellow' : 
                          booking.status === 'Rejected' ? 'badge-red' : 'badge-gray'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">⚡ Quick Actions</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <Link href="/bookings" className="btn btn-primary flex items-center justify-center gap-2">
                    <span>📅</span> <span>New Booking</span>
                  </Link>
                  <Link href="/history" className="btn btn-outline flex items-center justify-center gap-2">
                    <span>📚</span> <span>View All History</span>
                  </Link>
                  <Link href="/availability" className="btn btn-outline flex items-center justify-center gap-2">
                    <span>🕐</span> <span>Check Availability</span>
                  </Link>
                  <button 
                    className="btn btn-outline flex items-center justify-center gap-2"
                    onClick={() => setTab('profile')}
                  >
                    <span>✏️</span> <span>Edit Profile</span>
                  </button>
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

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import { BRANCHES, DIVISIONS, CLASS_YEARS, GAMES, GROUNDS, TIME_SLOTS, MAX_TEAM_MEMBERS, ALLOWED_EMAIL_DOMAIN } from '../constants';
import { ShieldCheck, AlertCircle, Lock, Phone, PhoneCall, GraduationCap } from 'lucide-react';

const SEMESTERS_BY_YEAR: Record<string, number[]> = {
  FE: [1, 2],
  SE: [3, 4],
  TE: [5, 6],
  BE: [7, 8],
};

const YEAR_TITLES: Record<string, string> = {
  FE: 'First Year (FE)',
  SE: 'Second Year (SE)',
  TE: 'Third Year (TE)',
  BE: 'Final Year (BE)',
};

export default function BookingForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [branch, setBranch] = useState('INFT');
  const [roll, setRoll] = useState('');
  const [division, setDivision] = useState('A');
  const [classYear, setClassYear] = useState('SE');
  const [semester, setSemester] = useState('3');
  const [isProfileVerified, setIsProfileVerified] = useState(false);

  const [game, setGame] = useState('');
  const [ground, setGround] = useState('');
  const [date, setDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ name: string; roll: string; email: string }[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      try {
        const { data } = await api.get('/api/auth/me');
        if (isMounted) {
          const user = data?.data?.user;
          setMe(user);
          if (user) {
            if (user.phone) setPhone(user.phone);
            if (user.alternatePhone) setAlternatePhone(user.alternatePhone);
            if (user.branch) setBranch(user.branch);
            if (user.division) setDivision(user.division);
            if (user.classYear) setClassYear(user.classYear);
            if (user.roll) setRoll(user.roll);
            if (user.semester) setSemester(String(user.semester));
            else if (user.classYear === 'FE') setSemester('1');
            else if (user.classYear === 'SE') setSemester('3');
            else if (user.classYear === 'TE') setSemester('5');
            else if (user.classYear === 'BE') setSemester('7');
            setIsProfileVerified(Boolean(user.academicProfileVerified));
          }
        }
      } catch {
        if (isMounted) {
          router.replace('/login');
        }
      }
    };
    load();
    
    return () => {
      isMounted = false;
    };
  }, [router]);

  const isFutureDate = useMemo(() => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(date + 'T00:00:00');
    return d >= today;
  }, [date]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAvailability = async () => {
      if (!date || !ground) return;
      try {
        const { data } = await api.get('/bookings/availability', { params: { date, ground } });
        if (isMounted) {
          setBookedTimes(data?.data?.bookedTimes || []);
        }
      } catch {
        if (isMounted) {
          setBookedTimes([]);
        }
      }
    };
    fetchAvailability();
    
    return () => {
      isMounted = false;
    };
  }, [date, ground]);

  const normalizePhone = (raw: string): string => {
    let clean = (raw || '').trim().replace(/[\s\-\(\)]/g, '');
    if (clean.startsWith('+91')) clean = clean.substring(3);
    else if (clean.startsWith('91') && clean.length === 12) clean = clean.substring(2);
    else if (clean.startsWith('0') && clean.length === 11) clean = clean.substring(1);
    return clean;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Phone validation
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) {
      setError('Primary mobile number is required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (starts with 6-9).');
      return;
    }
    if (/^(\d)\1{9}$/.test(cleanPhone)) {
      setError('Mobile number cannot be all identical digits.');
      return;
    }

    if (alternatePhone && alternatePhone.trim()) {
      const cleanAlt = normalizePhone(alternatePhone);
      if (!/^[6-9]\d{9}$/.test(cleanAlt)) {
        setError('Alternate mobile number must be a valid 10-digit Indian mobile number.');
        return;
      }
      if (/^(\d)\1{9}$/.test(cleanAlt)) {
        setError('Alternate mobile number cannot be all identical digits.');
        return;
      }
      if (cleanAlt === cleanPhone) {
        setError('Alternate mobile number must be different from primary mobile number.');
        return;
      }
    }

    // Academic validation
    if (!isProfileVerified) {
      const activeRoll = roll.trim() || me?.roll?.trim() || '';
      if (!activeRoll) {
        setError('College roll number is required.');
        return;
      }
      if (!/^[A-Za-z0-9]{1,10}$/.test(activeRoll)) {
        setError('Roll number must be alphanumeric (max 10 characters).');
        return;
      }
      const allowedSemesters = SEMESTERS_BY_YEAR[classYear] || [];
      if (!allowedSemesters.includes(Number(semester))) {
        setError(`Semester ${semester} is not valid for ${YEAR_TITLES[classYear] || classYear}.`);
        return;
      }
    }

    if (!isFutureDate) {
      setError('Date must be today or later');
      return;
    }
    if (selectedSlots.length === 0) {
      setError('Please select at least one time slot');
      return;
    }
    if (selectedSlots.length > 2) {
      setError('You can select a maximum of 2 time slots');
      return;
    }
    if (teamMembers.length > MAX_TEAM_MEMBERS) {
      setError(`You can add up to ${MAX_TEAM_MEMBERS} players per booking.`);
      return;
    }
    const seenRolls = new Set<string>();
    const seenEmails = new Set<string>();
    for (const m of teamMembers) {
      if (!m.name || !m.roll || !m.email) {
        setError('All team members must have name, roll and email.');
        return;
      }
      if (!m.email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        setError('Invalid teammate email domain.');
        return;
      }
      if (seenRolls.has(m.roll) || seenEmails.has(m.email)) {
        setError('Duplicate teammate roll or email detected.');
        return;
      }
      seenRolls.add(m.roll);
      seenEmails.add(m.email);
      if (me?.roll && m.roll === me.roll) {
        setError('Teammate roll cannot be the same as the booking student.');
        return;
      }
      if (me?.email && m.email === me.email) {
        setError('Teammate email cannot be the same as the booking student.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const cleanAlt = alternatePhone.trim() ? normalizePhone(alternatePhone) : undefined;
      const payload = {
        name: me?.name,
        roll: (roll || me?.roll || '').trim().toUpperCase(),
        branch,
        division,
        classYear,
        semester: Number(semester),
        phone: cleanPhone,
        alternatePhone: cleanAlt,
        ground,
        game,
        date,
        timeSlots: selectedSlots,
        teamMembers,
      };
      await api.post('/bookings', payload);
      
      setSuccess(`✅ Booking with ${selectedSlots.length} slot(s) submitted successfully! Awaiting admin approval.`);
      setGame('');
      setGround('');
      setDate('');
      setSelectedSlots([]);
      setTeamMembers([]);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-xl p-6 sm:p-8 rounded-2xl w-full max-w-2xl mx-auto mt-6">
      <div className="mb-6 text-center">
        <span className="text-[10px] font-black tracking-widest uppercase bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
          CampusPLAY Ground Booking
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] mt-2">
          STUDENT ACADEMIC INFORMATION & CONTACT DETAILS
        </h2>
        <p className="text-xs text-[#52657A] mt-1">
          Review your academic record and provide your contact number for ground authorization.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-[12px] border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700 flex items-center gap-2">
          <ShieldCheck size={16} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        
        {/* SECTION 1: STUDENT DETAILS */}
        <div className="border border-[#E2E8F0] rounded-[16px] p-4 bg-slate-50/50">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              SECTION 1: STUDENT DETAILS
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name (From Profile)</label>
              <input className="input text-xs font-semibold bg-slate-100" value={me?.name || ''} readOnly />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">College Email ({ALLOWED_EMAIL_DOMAIN})</label>
              <input className="input text-xs font-semibold bg-slate-100" value={me?.email || ''} readOnly />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                Mobile Number <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 select-none">+91</span>
                <input
                  className="input text-xs font-bold pl-11"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                Alternate Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 select-none">+91</span>
                <input
                  className="input text-xs font-bold pl-11"
                  maxLength={10}
                  placeholder="e.g. 9123456789"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ACADEMIC DETAILS */}
        <div className="border border-[#E2E8F0] rounded-[16px] p-4 bg-slate-50/50">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
              SECTION 2: ACADEMIC DETAILS
            </h3>
            {isProfileVerified && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Lock size={12} /> Verified Profile (Locked)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Roll Number <span className="text-rose-500 font-bold">*</span></label>
              <input
                className={`input text-xs font-bold ${isProfileVerified ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                value={roll}
                readOnly={isProfileVerified}
                onChange={(e) => setRoll(e.target.value.toUpperCase())}
                placeholder="e.g. 24IT101"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Branch <span className="text-rose-500 font-bold">*</span></label>
              <select
                className={`input text-xs font-bold ${isProfileVerified ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                value={branch}
                disabled={isProfileVerified}
                onChange={(e) => setBranch(e.target.value)}
                required
              >
                {BRANCHES.map((b) => (<option key={b} value={b}>{b}</option>))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Year of Study <span className="text-rose-500 font-bold">*</span></label>
              <select
                className={`input text-xs font-bold ${isProfileVerified ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                value={classYear}
                disabled={isProfileVerified}
                onChange={(e) => {
                  const y = e.target.value;
                  setClassYear(y);
                  const allowed = SEMESTERS_BY_YEAR[y] || [];
                  if (!allowed.includes(Number(semester))) {
                    setSemester(String(allowed[0] || '1'));
                  }
                }}
                required
              >
                {CLASS_YEARS.map((y) => (<option key={y} value={y}>{YEAR_TITLES[y] || y}</option>))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Semester <span className="text-rose-500 font-bold">*</span></label>
              <select
                className={`input text-xs font-bold ${isProfileVerified ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                value={semester}
                disabled={isProfileVerified}
                onChange={(e) => setSemester(e.target.value)}
                required
              >
                {(SEMESTERS_BY_YEAR[classYear] || [1, 2]).map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Division <span className="text-rose-500 font-bold">*</span></label>
              <select
                className={`input text-xs font-bold ${isProfileVerified ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                value={division}
                disabled={isProfileVerified}
                onChange={(e) => setDivision(e.target.value)}
                required
              >
                {DIVISIONS.map((d) => (<option key={d} value={d}>Division {d}</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: SPORTS BOOKING */}
        <div className="border border-[#E2E8F0] rounded-[16px] p-4 bg-slate-50/50">
          <div className="border-b border-[#E2E8F0] pb-2.5 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
              SECTION 3: SPORTS BOOKING
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sport</label>
              <select className="input text-xs font-bold" value={game} onChange={(e) => setGame(e.target.value)} required>
                <option value="" disabled>Select Sport</option>
                {GAMES.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ground</label>
              <select className="input text-xs font-bold" value={ground} onChange={(e) => setGround(e.target.value)} required>
                <option value="" disabled>Select Ground</option>
                {GROUNDS.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
              <input
                className="input text-xs font-bold"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-slate-700 block mb-1">Time Slots (Select up to 2)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {date && ground && TIME_SLOTS.map((t) => {
                const isBooked = bookedTimes.includes(t);
                const isSelected = selectedSlots.includes(t);
                const canSelect = !isBooked && (isSelected || selectedSlots.length < 2);
                
                return (
                  <label 
                    key={t} 
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' 
                        : isBooked 
                          ? 'border-red-200 bg-red-50 text-red-400 opacity-60 cursor-not-allowed' 
                          : canSelect
                            ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!canSelect}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedSlots.length < 2) {
                            setSelectedSlots([...selectedSlots, t]);
                          }
                        } else {
                          setSelectedSlots(selectedSlots.filter(s => s !== t));
                        }
                      }}
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <span className="flex-1 truncate">{t}</span>
                  </label>
                );
              })}
              {(!date || !ground) && (
                <div className="col-span-full text-xs text-gray-500 italic p-3 bg-white rounded-lg border border-dashed border-gray-300">
                  Select sport, ground, and date first to see available slots
                </div>
              )}
            </div>
          </div>

          {/* Squad */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2">Squad Members ({teamMembers.length}/{MAX_TEAM_MEMBERS})</div>
            {teamMembers.map((m, idx) => (
              <div key={idx} className="border border-blue-200 rounded-xl p-3 bg-blue-50/50 mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input className="input text-xs py-1.5" placeholder="Name" value={m.name} onChange={(e) => {
                    const arr = [...teamMembers]; arr[idx] = { ...arr[idx], name: e.target.value }; setTeamMembers(arr);
                  }} />
                  <input className="input text-xs py-1.5 uppercase" placeholder="Roll Number" value={m.roll} onChange={(e) => {
                    const arr = [...teamMembers]; arr[idx] = { ...arr[idx], roll: e.target.value.toUpperCase() }; setTeamMembers(arr);
                  }} />
                  <input className="input text-xs py-1.5" placeholder={`Email (${ALLOWED_EMAIL_DOMAIN})`} value={m.email} onChange={(e) => {
                    const arr = [...teamMembers]; arr[idx] = { ...arr[idx], email: e.target.value }; setTeamMembers(arr);
                  }} />
                </div>
                <div className="mt-2 flex justify-end">
                  <button type="button" className="text-xs text-rose-600 font-bold hover:underline" onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}>Remove Player</button>
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                className="btn btn-outline text-xs px-3 py-1.5 font-bold"
                onClick={() => {
                  if (teamMembers.length < MAX_TEAM_MEMBERS) setTeamMembers([...teamMembers, { name: '', roll: '', email: '' }]);
                }}
                disabled={teamMembers.length >= MAX_TEAM_MEMBERS}
              >
                + Add Teammate
              </button>
            </div>
          </div>

        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn btn-primary flex-1 py-3 text-xs font-black uppercase tracking-wider" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Booking Request'}
          </button>
          <button className="btn btn-outline py-3 text-xs font-bold" type="button" onClick={() => router.push('/')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';

const BRANCHES = ['INFT', 'CMPN', 'EXTC', 'EXCS', 'BIOMED'];
const DIVISIONS = ['A', 'B', 'C'];
const YEARS = ['FE', 'SE', 'TE', 'BE'];
const GAMES = ['Cricket', 'Football', 'Volleyball', 'Badminton'];
const GROUNDS = ['Ground 1', 'Ground 2'];
const TIME_SLOTS = ['7–8 AM', '8–9 AM', '9–10 AM', '10–11 AM', '11–12 AM', '4–5 PM', '5–6 PM', '6–7 PM'];

export default function BookingForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [branch, setBranch] = useState('');
  const [roll, setRoll] = useState('');
  const [division, setDivision] = useState('');
  const [classYear, setClassYear] = useState('');
  const [game, setGame] = useState('');
  const [ground, setGround] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ name: string; roll: string; email: string }[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const user = data?.data?.user;
        setMe(user);
        setBranch(user?.branch || '');
        setDivision(user?.division || '');
        setClassYear(user?.classYear || '');
        setRoll(user?.roll || '');
      } catch {
        router.replace('/login');
      }
    };
    load();
  }, [router]);

  const isFutureDate = useMemo(() => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(date + 'T00:00:00');
    return d >= today;
  }, [date]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!date || !ground) return;
      try {
        const { data } = await api.get('/bookings/availability', { params: { date, ground } });
        setBookedTimes(data?.data?.bookedTimes || []);
      } catch {
        setBookedTimes([]);
      }
    };
    fetchAvailability();
  }, [date, ground]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isFutureDate) {
      setError('Date must be today or later');
      return;
    }
    // client-side validation for team members
    if (teamMembers.length > 10) {
      setError('You can add up to 10 players per booking.');
      return;
    }
    const seenRolls = new Set<string>();
    const seenEmails = new Set<string>();
    for (const m of teamMembers) {
      if (!m.name || !m.roll || !m.email) {
        setError('All team members must have name, roll and email.');
        return;
      }
      if (!m.email.endsWith('@vit.edu.in')) {
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
      const payload = {
        name: me?.name,
        branch,
        division,
        classYear,
        ground,
        game,
        date,
        time,
        teamMembers,
      };
      await api.post('/bookings', payload);
      setSuccess('✅ Slot booked successfully! Awaiting admin approval.');
      setGame('');
      setGround('');
      setDate('');
      setTime('');
      setTeamMembers([]);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit';
      setError(msg);
    }
  };

  return (
    <div className="bg-white shadow-xl p-8 rounded-2xl w-full max-w-lg mx-auto mt-10">
      <div className="mb-6 text-center text-xl font-semibold text-blue-700">🏏 Book Your Ground — Play Without Hassle!</div>
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">{success}</div>}
      <h1 className="mb-4 text-2xl font-semibold text-blue-700">Book Ground Slot</h1>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm font-medium">Name</label>
          <input className="input" value={me?.name || ''} readOnly />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm font-medium">Roll Number</label>
          <input className="input" value={roll} readOnly aria-readonly placeholder="Roll number (locked)" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Branch</label>
            <select className="input" value={branch} onChange={(e) => setBranch(e.target.value)} required>
              <option value="" disabled>Select</option>
              {BRANCHES.map((b) => (<option key={b} value={b}>{b}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Division</label>
            <select className="input" value={division} onChange={(e) => setDivision(e.target.value)} required>
              <option value="" disabled>Select</option>
              {DIVISIONS.map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Class Year</label>
            <select className="input" value={classYear} onChange={(e) => setClassYear(e.target.value)} required>
              <option value="" disabled>Select</option>
              {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Game</label>
            <select className="input" value={game} onChange={(e) => setGame(e.target.value)} required>
              <option value="" disabled>Select</option>
              {GAMES.map((g) => (<option key={g} value={g}>{g}</option>))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Ground</label>
            <select className="input" value={ground} onChange={(e) => setGround(e.target.value)} required>
              <option value="" disabled>Select</option>
              {GROUNDS.map((g) => (<option key={g} value={g}>{g}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Time Slot</label>
          <select className="input" value={time} onChange={(e) => setTime(e.target.value)} required>
            <option value="" disabled>{!date || !ground ? 'Select date and ground first' : 'Select'}</option>
            {date && ground && TIME_SLOTS.map((t) => (
              <option key={t} value={t} disabled={bookedTimes.includes(t)}>
                {t}{bookedTimes.includes(t) ? ' (Booked)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mt-4 text-sm font-semibold text-blue-700">Who else is playing with you?</div>
          {teamMembers.map((m, idx) => (
            <div key={idx} className="border border-blue-200 rounded-xl p-4 bg-blue-50 mt-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input className="input" placeholder="Name" value={m.name} onChange={(e) => {
                  const arr = [...teamMembers]; arr[idx] = { ...arr[idx], name: e.target.value }; setTeamMembers(arr);
                }} />
                <input className="input" placeholder="Roll Number" value={m.roll} onChange={(e) => {
                  const arr = [...teamMembers]; arr[idx] = { ...arr[idx], roll: e.target.value }; setTeamMembers(arr);
                }} />
                <input className="input" placeholder="College Email (@vit.edu.in)" value={m.email} onChange={(e) => {
                  const arr = [...teamMembers]; arr[idx] = { ...arr[idx], email: e.target.value }; setTeamMembers(arr);
                }} />
              </div>
              <div className="mt-2 flex justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}>Remove Player</button>
              </div>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between">
            <button type="button" className="btn btn-secondary" onClick={() => {
              if (teamMembers.length < 10) setTeamMembers([...teamMembers, { name: '', roll: '', email: '' }]);
            }}>Add Player</button>
            <div className="text-xs text-gray-600">You can add up to 10 players per booking.</div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button className="btn btn-primary" type="submit">Book Slot</button>
          <button className="btn btn-secondary" type="button" onClick={() => router.push('/')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';

const GAMES = ['Cricket', 'Football', 'Volleyball', 'Badminton'];
const GROUNDS = ['Ground 1', 'Ground 2'];
const TIME_SLOTS = ['8–9 AM','9–10 AM','10–11 AM','11–12 AM','12–1 PM','1–2 PM','2–3 PM','3–4 PM','4–5 PM','5–6 PM','6–7 PM'];

export default function BookingWizard({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [me, setMe] = useState<any>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // selections
  const [game, setGame] = useState('');
  const [ground, setGround] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [teamMembers, setTeamMembers] = useState<{ name: string; roll: string; email: string }[]>([]);

  const [slots, setSlots] = useState<{ slot: string; status: 'Vacant' | 'Booked' | 'Pending'; bookedBy?: string | null; game?: string | null }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ game: string; ground: string; date: string; time: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setMe(data?.data?.user || null);
      } catch {
        router.replace('/login');
      }
    };
    load();
  }, [router]);

  const formatDate = (isoDate: string): string => {
    try {
      const d = new Date(isoDate + 'T00:00:00');
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoDate;
    }
  };

  useEffect(() => {
    if (modalOpen) {
      const t = setTimeout(() => {
        router.push('/bookings');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [modalOpen, router]);

  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isToday = useMemo(() => date === minDate, [date, minDate]);
  const currentHour = useMemo(() => {
    const d = new Date();
    return d.getHours();
  }, []);

  const slotStartHour = (label: string): number => {
    // Parse labels like '8–9 AM', '12–1 PM', '1–2 PM'
    const [start, endPart] = label.split('–');
    const [startRaw, ampm] = start.split(' ');
    let h = parseInt(startRaw, 10);
    const isPM = (ampm || (endPart.includes('PM') ? 'PM' : 'AM')).includes('PM');
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h;
  };

  const canGoNextFrom1 = game && ground;
  const canGoNextFrom2 = date && time;

  useEffect(() => {
    const fetchSlots = async () => {
      if (!date || !ground) return;
      try {
        setLoadingSlots(true);
        const { data } = await api.get('/bookings/availability', { params: { date, ground } });
        setSlots(data?.data?.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [date, ground]);

  const scrollToTop = () => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const next = () => {
    setStep((s) => {
      const v = (Math.min(4, s + 1) as 1 | 2 | 3 | 4);
      setTimeout(scrollToTop, 10);
      return v;
    });
  };
  const prev = () => {
    setStep((s) => {
      const v = (Math.max(1, s - 1) as 1 | 2 | 3 | 4);
      setTimeout(scrollToTop, 10);
      return v;
    });
  };

  const validateTeam = (): string | null => {
    if (teamMembers.length > 10) return 'You can add up to 10 teammates (11 players including you).';
    const seenRolls = new Set<string>();
    const seenEmails = new Set<string>();
    for (const m of teamMembers) {
      if (!m.name || !m.roll || !m.email) return 'All teammates need name, roll and email.';
      if (!m.email.endsWith('@vit.edu.in')) return 'All teammate emails must end with @vit.edu.in';
      if (seenRolls.has(m.roll) || seenEmails.has(m.email)) return 'Duplicate teammate roll or email.';
      seenRolls.add(m.roll); seenEmails.add(m.email);
      if (me?.roll && m.roll === me.roll) return 'Teammate roll cannot be the same as the booking student.';
      if (me?.email && m.email === me.email) return 'Teammate email cannot be the same as the booking student.';
    }
    return null;
  };

  const submit = async () => {
    setError(''); setSuccess('');
    const teamErr = validateTeam();
    if (teamErr) { setError(teamErr); setStep(3); return; }
    try {
      setSubmitting(true);
      await api.post('/bookings', { game, ground, date, time, teamMembers });
      setSuccess('✅ Booking submitted! Pending admin approval. We\'ll notify you soon.');
      setToast(`🎉 Booking for ${game} @ ${ground} (${time}) submitted successfully!`);
      setTimeout(()=> setToast(''), 2500);
      onSuccess();
      setModalOpen(true);
      setConfirmation({ game, ground, date, time });
      // Clear form to avoid accidental resubmission
      setGame('');
      setGround('');
      setDate('');
      setTime('');
      setTeamMembers([]);
      setStep(1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit booking';
      setError(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div ref={containerRef} className="bg-white/80 backdrop-blur shadow-xl p-6 rounded-2xl w-full max-w-xl mx-auto">
      {toast && <div className="fixed right-4 top-20 z-50 rounded-lg bg-green-600 px-3 py-2 text-sm text-white shadow">{toast}</div>}
      <div className="mb-2 text-lg font-semibold text-blue-700">Let’s get you on the field 🎯</div>
      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full transition-all" style={{ width: `${(step-1) * 33.33}%`, background: 'linear-gradient(90deg,#3B82F6,#10B981)' }} />
      </div>

      {/* Stepper */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className={`px-2 py-1 rounded ${step>=1?'bg-blue-600 text-white':'bg-gray-200'}`}>1. Select</span>
        <span className="text-gray-400">→</span>
        <span className={`px-2 py-1 rounded ${step>=2?'bg-blue-600 text-white':'bg-gray-200'}`}>2. Slot</span>
        <span className="text-gray-400">→</span>
        <span className={`px-2 py-1 rounded ${step>=3?'bg-blue-600 text-white':'bg-gray-200'}`}>3. Players</span>
        <span className="text-gray-400">→</span>
        <span className={`px-2 py-1 rounded ${step===4?'bg-green-600 text-white':'bg-gray-200'}`}>Done</span>
      </div>

      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      {!modalOpen && success && <div className="mb-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">{success}</div>}

      {/* Step 1: Select Ground & Sport */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Sport</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {GAMES.map((g) => (
                <button key={g} type="button" className={`btn ${game===g?'btn-primary':'btn-ghost'}`} onClick={() => setGame(g)}>{g}</button>
              ))}
            </div>
            <div className="mt-1 text-xs text-gray-500">Pick your favorite sport — we’ll handle the rest.</div>
          </div>
          <div>
            <label className="text-sm font-medium">Ground</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {GROUNDS.map((g) => (
                <button key={g} type="button" className={`btn ${ground===g?'btn-primary':'btn-ghost'}`} onClick={() => setGround(g)}>{g}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Choose sport and ground to continue</span>
            <button className="btn btn-primary" disabled={!canGoNextFrom1} onClick={() => setStep(2)}>Next</button>
          </div>
        </div>
      )}

      {/* Step 2: Pick Date & Time with grid */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Date</label>
            <input className="input mt-1" type="date" min={minDate} value={date} onChange={(e)=>{setDate(e.target.value); setTime('');}} />
            <div className="mt-1 text-xs text-gray-500">Choose your playtime — slots available between 8 AM and 7 PM.</div>
          </div>
          <div>
            <label className="text-sm font-medium">Time Slot</label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const info = slots.find(s => s.slot === slot);
                const status = info?.status || 'Vacant';
                const blockedByBooking = status === 'Booked' || status === 'Pending';
                const hour = slotStartHour(slot);
                const blockedByTime = isToday && hour <= currentHour;
                const blocked = blockedByBooking || blockedByTime;
                const color = status === 'Booked' ? 'bg-red-100 text-red-800 border-red-200' : status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200';
                return (
                  <button key={slot} type="button"
                    disabled={!date || blocked}
                    onClick={() => setTime(slot)}
                    className={`rounded-lg border px-3 py-2 text-sm ${color} ${time===slot?'ring-2 ring-emerald-400':''} disabled:opacity-60`} title={blockedByBooking ? 'Already booked' : (blockedByTime ? 'Time passed' : '')}>
                    <div className="font-medium">{slot}</div>
                    <div className="text-xs">{status === 'Vacant' ? '🟢 Available' : status === 'Pending' ? '🟡 Pending' : '🔴 Booked'}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button className="btn btn-secondary" onClick={prev}>Back</button>
            <button className="btn btn-primary" disabled={!canGoNextFrom2} onClick={next}>Next</button>
          </div>
        </div>
      )}

      {/* Step 3: Add Players & Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl border p-3">
            <div className="font-semibold text-blue-700 mb-2">Summary</div>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Sport: <b>{game}</b></div>
              <div>Ground: <b>{ground}</b></div>
              <div>Date: <b>{date}</b></div>
              <div>Time: <b>{time}</b></div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-blue-700">Players</div>
            <div className="mt-2 text-sm text-gray-700">You (pre-filled): {me?.name} • {me?.email}</div>
            <div className="mt-1 text-xs text-gray-600">Roll: {me?.roll} • Branch: {me?.branch} • Division: {me?.division} • Year: {me?.classYear}</div>
            <div className="mt-1 text-xs text-gray-500">Add your teammates — make sure they’re using VIT emails.</div>
            {teamMembers.map((m, idx) => (
              <div key={idx} className="border rounded-xl p-3 bg-blue-50 mt-2">
                <div className="grid gap-2 md:grid-cols-3">
                  <input className="input" placeholder="Name" value={m.name} onChange={(e)=>{const arr=[...teamMembers]; arr[idx]={...arr[idx], name:e.target.value}; setTeamMembers(arr);}} />
                  <input className="input" placeholder="Roll" value={m.roll} onChange={(e)=>{const arr=[...teamMembers]; arr[idx]={...arr[idx], roll:e.target.value}; setTeamMembers(arr);}} />
                  <input className="input" placeholder="Email (@vit.edu.in)" value={m.email} onChange={(e)=>{const arr=[...teamMembers]; arr[idx]={...arr[idx], email:e.target.value}; setTeamMembers(arr);}} />
                </div>
                <div className="mt-2 text-right">
                  <button type="button" className="btn btn-secondary" onClick={()=>setTeamMembers(teamMembers.filter((_,i)=>i!==idx))}>Remove</button>
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between">
              <button type="button" className="btn btn-secondary" onClick={()=>{ if (teamMembers.length < 10) setTeamMembers([...teamMembers, { name:'', roll:'', email:'' }]); }}>Add Teammate</button>
              <div className="text-xs text-gray-600">Up to 10 teammates allowed (11 including you).</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button className="btn btn-secondary" onClick={prev}>Back</button>
            <button className="btn btn-primary" disabled={submitting} onClick={submit}>{submitting ? 'Submitting...' : 'Confirm Booking'}</button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm p-4 modal-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl modal-scale-in">
            <div className="text-2xl font-semibold">✅ Booking submitted</div>
            <div className="mt-2 text-sm text-gray-700">Your booking has been submitted! We’ll notify you when the admin confirms.</div>
            {confirmation && (
              <div className="mt-4 text-sm text-gray-700">
                <span className="font-medium">{confirmation.game}</span> @ <span className="font-medium">{confirmation.ground}</span>, {confirmation.time} on {formatDate(confirmation.date)}.
              </div>
            )}
            <div className="mt-5 progress-bar">
              <div className="bar" />
            </div>
            <div className="mt-2 text-xs text-gray-500">Redirecting to My Bookings…</div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost border border-blue-300 text-blue-700" onClick={()=> { setModalOpen(false); setStep(1); scrollToTop(); }}>Book Another Ground</button>
              <button className="btn btn-primary" onClick={()=> { setModalOpen(false); router.push('/bookings'); }}>Go to My Bookings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

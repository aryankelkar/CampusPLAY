import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import { GAMES, GROUNDS, TIME_SLOTS, BOOKING_STATUS, MAX_TEAM_MEMBERS } from '../constants';
import { getTodayDate, extractSlotHour, isToday } from '../utils/helpers';

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

  const [slots, setSlots] = useState<{ slot: string; status: 'Vacant' | 'Booked'; bookedBy?: string | null; game?: string | null }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ game: string; ground: string; date: string; time: string } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

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
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Let's get you on the field 🎾
          </h2>
        </div>
        <p className="text-sm text-gray-600 ml-10">Follow the steps to book your slot</p>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full transition-all" style={{ width: `${(step - 1) * 33.33}%`, background: 'linear-gradient(90deg,#3B82F6,#10B981)' }} />
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between px-4">
        {[{ num: 1, label: 'Select' }, { num: 2, label: 'Slot' }, { num: 3, label: 'Players' }].map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm transition-all ${
                step === s.num ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg ring-4 ring-blue-100 scale-110' : step > s.num ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${
                step === s.num ? 'text-blue-600' : step > s.num ? 'text-green-600' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mx-2 -mt-6 rounded transition-all ${step > s.num ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Sport & Ground */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Sport selection */}
          <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur p-5 shadow-sm hover:shadow-md transition-all">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="text-lg">⚽</span> Sport
              </label>
              <span className="text-xs text-gray-500 italic">Pick your favourite</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {GAMES.map((g, idx) => {
                const icons = { Cricket: '🏏', Football: '⚽', Volleyball: '🏐', Badminton: '🏸' };
                return (
                  <button key={g} type="button" onClick={() => setGame(g)}
                    className={`group h-[72px] rounded-xl border-2 px-4 py-3 text-left transition-all ${
                      game === g
                        ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md scale-105'
                        : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{icons[g as keyof typeof icons]}</span>
                      <div className="flex-1">
                        <div className={`font-semibold text-sm ${
                          game === g ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-600'
                        }`}>{g}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {game === g ? '✓ Selected' : 'Click to select'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200" />

          {/* Ground selection */}
          <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur p-5 shadow-sm hover:shadow-md transition-all">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="text-lg">🏟️</span> Ground
              </label>
              <span className="text-xs text-gray-500 italic">Choose location</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {GROUNDS.map((gr) => (
                <button key={gr} type="button" onClick={() => setGround(gr)}
                  className={`group h-[72px] rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    ground === gr
                      ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-green-200 hover:shadow-sm hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏟️</span>
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${
                        ground === gr ? 'text-green-700' : 'text-gray-800 group-hover:text-green-600'
                      }`}>{gr}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {ground === gr ? '✓ Selected' : 'Available'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end pt-4 gap-3">
            <button
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
              disabled={!canGoNextFrom1}
              onClick={next}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Pick Date & Time with grid */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Date */}
          <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur p-5 shadow-sm hover:shadow-md transition-all">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="text-lg">📆</span> Date
              </label>
              <span className="text-xs text-gray-500 italic">Select a day</span>
            </div>
            <input className="input" type="date" min={minDate} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} />
            <div className="mt-2 text-xs text-gray-500">Choose your playtime — slots available between 8 AM and 7 PM.</div>
          </div>

          {/* Time slot legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            <span className="font-medium">Legend:</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Available</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Booked (Approved)</span>
          </div>

          {/* Time slots */}
          <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur p-5 shadow-sm hover:shadow-md transition-all">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="text-lg">🕒</span> Time Slot
              </label>
              {!date && <span className="text-xs text-gray-500 italic">Pick a date first</span>}
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TIME_SLOTS.map((slot) => {
                const info = slots.find(s => s.slot === slot);
                const status = info?.status || 'Vacant';
                const blockedByBooking = status === 'Booked';
                const hour = slotStartHour(slot);
                const blockedByTime = isToday && hour <= currentHour;
                const blocked = blockedByBooking || blockedByTime;
                const color = status === 'Booked' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200';
                return (
                  <button key={slot} type="button"
                    disabled={!date || blocked}
                    onClick={() => setTime(slot)}
                    className={`h-[64px] rounded-xl border px-3 py-2 text-sm text-left ${color} ${time===slot?'ring-2 ring-emerald-400':''} disabled:opacity-60`} title={blockedByBooking ? 'Already booked' : (blockedByTime ? 'Time passed' : '')}>
                    <div className="font-medium">{slot}</div>
                    <div className="text-xs">{status === 'Vacant' ? '🟢 Available' : '🔴 Booked'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <button className="btn btn-secondary" onClick={prev}>Back</button>
            <button className="btn btn-primary" disabled={!canGoNextFrom2} onClick={next}>Next</button>
          </div>
        </div>
      )}

      {/* Step 3: Add Players & Confirm */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold text-slate-800">Summary</div>
              <span className="text-xs text-gray-500">Review your selection</span>
            </div>
            <div className="text-sm text-gray-700 grid grid-cols-2 gap-y-1">
              <div>Sport:</div><div className="font-medium">{game}</div>
              <div>Ground:</div><div className="font-medium">{ground}</div>
              <div>Date:</div><div className="font-medium">{date}</div>
              <div>Time:</div><div className="font-medium">{time}</div>
            </div>
          </div>

          {/* Players */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Players</div>
              <span className="text-xs text-gray-500">Add up to 10 teammates</span>
            </div>
            <div className="text-sm text-gray-700">You (pre-filled): {me?.name} • {me?.email}</div>
            <div className="mt-1 text-xs text-gray-600">Roll: {me?.roll} • Branch: {me?.branch} • Division: {me?.division} • Year: {me?.classYear}</div>
            <div className="mt-1 text-xs text-gray-500">All teammate emails must end with @vit.edu.in</div>
            {teamMembers.map((m, idx) => (
              <div key={idx} className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <input className="input" placeholder="Name" value={m.name} onChange={(e)=>{const arr=[...teamMembers]; arr[idx]={...arr[idx], name:e.target.value}; setTeamMembers(arr);}} />
                  <input className="input" placeholder="Roll" value={m.roll} onChange={(e)=>{const arr=[...teamMembers]; arr[idx]={...arr[idx], roll:e.target.value}; setTeamMembers(arr);}} />
                  <div className="flex items-center gap-2">
                    <input className="input flex-1" placeholder="Email (@vit.edu.in)" value={m.email} onChange={(e)=>{const arr=[...teamMembers]; arr[idx]={...arr[idx], email:e.target.value}; setTeamMembers(arr);}} />
                    <button type="button" aria-label="Remove" className="btn btn-secondary" onClick={()=>setTeamMembers(teamMembers.filter((_,i)=>i!==idx))}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between">
              <button type="button" className="btn btn-secondary" onClick={()=>{ if (teamMembers.length < 10) setTeamMembers([...teamMembers, { name:'', roll:'', email:'' }]); }}>Add Teammate</button>
              <div className="text-xs text-gray-600">Up to 10 teammates allowed (11 including you).</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <button className="btn btn-secondary" onClick={prev}>Back</button>
            <button className="btn btn-primary" disabled={submitting} onClick={()=> setReviewOpen(true)}>{submitting ? 'Submitting...' : 'Confirm Booking'}</button>
          </div>
        </div>
      )}

      {/* Review/Confirmation Modal - Before Submit */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="text-xl font-bold text-slate-800 mb-4">📋 Review Your Booking</div>
            
            {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sport:</span>
                <span className="font-semibold text-gray-900">{game}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ground:</span>
                <span className="font-semibold text-gray-900">{ground}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold text-gray-900">{formatDate(date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold text-gray-900">{time}</span>
              </div>
              <div className="h-px bg-gray-200 my-3"></div>
              <div className="text-sm">
                <span className="text-gray-600">You:</span>
                <div className="font-medium text-gray-900 mt-1">{me?.name} • {me?.roll}</div>
                <div className="text-xs text-gray-500">{me?.email}</div>
              </div>
              {teamMembers.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600">Teammates ({teamMembers.length}):</span>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {teamMembers.map((m, idx) => (
                      <div key={idx} className="text-xs bg-blue-50 rounded-lg p-2">
                        <div className="font-medium text-gray-900">{m.name} • {m.roll}</div>
                        <div className="text-gray-600">{m.email}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                onClick={() => { setReviewOpen(false); setError(''); }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={() => { setReviewOpen(false); submit(); }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - After Submit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm p-4 modal-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl modal-scale-in">
            <div className="text-2xl font-semibold">✅ Booking submitted</div>
            <div className="mt-2 text-sm text-gray-700">Your booking has been submitted! We'll notify you when the admin confirms.</div>
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

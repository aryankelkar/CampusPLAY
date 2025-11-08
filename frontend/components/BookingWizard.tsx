import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import { GAMES, GROUNDS, TIME_SLOTS, BOOKING_STATUS, MAX_TEAM_MEMBERS } from '../constants';
import { getTodayDate, extractSlotHour } from '../utils/helpers';
import { useSocket } from '../context/SocketContext';

export default function BookingWizard({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
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
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [overlayLoading, setOverlayLoading] = useState(false);
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

  // Auto-redirect after overlay appears
  useEffect(() => {
    if (successOverlay && !overlayLoading) {
      // Auto-redirect after 2.5 seconds
      const redirectTimer = setTimeout(() => {
        console.log('🚀 Auto-redirecting to booking history...');
        setGame('');
        setGround('');
        setDate('');
        setTime('');
        setTeamMembers([]);
        setSuccessOverlay(false);
        setConfirmation(null);
        setOverlayLoading(false);
        onSuccess(); // Call parent handler before redirect
        router.push('/history');
      }, 2500);

      return () => {
        clearTimeout(redirectTimer);
      };
    }
  }, [successOverlay, overlayLoading, router, onSuccess]);

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

  // Real-time slot updates via Socket.io
  useEffect(() => {
    if (!socket || !date || !ground) return;

    const handleBookingUpdate = (data: any) => {
      console.log('🔄 Real-time booking update received:', data);
      
      // Refresh slots if the update affects current selection
      const booking = data?.booking;
      if (booking && booking.ground === ground && booking.date === date) {
        console.log('♻️ Refreshing slots due to booking update...');
        api.get('/bookings/availability', { params: { date, ground } })
          .then(({ data }) => {
            setSlots(data?.data?.slots || []);
            console.log('✅ Slots refreshed');
          })
          .catch((err) => {
            console.error('❌ Failed to refresh slots:', err);
          });
      }
    };

    // Listen for all booking events
    socket.on('booking:created', handleBookingUpdate);
    socket.on('booking:approved', handleBookingUpdate);
    socket.on('booking:rejected', handleBookingUpdate);
    socket.on('booking:revoked', handleBookingUpdate);

    return () => {
      socket.off('booking:created', handleBookingUpdate);
      socket.off('booking:approved', handleBookingUpdate);
      socket.off('booking:rejected', handleBookingUpdate);
      socket.off('booking:revoked', handleBookingUpdate);
    };
  }, [socket, date, ground]);

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
    // Prevent double submission
    if (submitting || successOverlay) {
      console.log('⚠️ Already submitting or overlay shown, ignoring click');
      return;
    }

    setError(''); 
    const teamErr = validateTeam();
    if (teamErr) { 
      setError(teamErr); 
      setStep(3); 
      setReviewOpen(false); 
      return; 
    }
    
    try {
      // STEP 1: Disable button and show loading state
      setSubmitting(true);
      
      // Save booking details BEFORE API call
      const bookingDetails = { game, ground, date, time };
      setConfirmation(bookingDetails);
      
      console.log('🔍 Starting booking submission...');
      console.log('📋 Booking details:', bookingDetails);
      
      // STEP 2: Close review modal and show overlay immediately
      setReviewOpen(false);
      setOverlayLoading(true);
      setSuccessOverlay(true);
      
      console.log('✨ Overlay shown immediately');
      
      // STEP 3: Pre-validate slot availability
      try {
        const { data: availData } = await api.get('/bookings/availability', {
          params: { ground, date }
        });
        
        const selectedSlot = availData?.data?.slots?.find((s: any) => s.slot === time);
        
        if (selectedSlot?.status === 'Booked') {
          console.warn('⚠️ Slot already booked during pre-validation');
          // Hide overlay and show error
          setSuccessOverlay(false);
          setOverlayLoading(false);
          setError('⚠️ This slot was just booked by another student. Please choose another time slot.');
          setSubmitting(false);
          // Refresh slots
          const { data } = await api.get('/bookings/availability', { params: { date, ground } });
          setSlots(data?.data?.slots || []);
          return;
        }
        
        console.log('✅ Slot is still available');
      } catch (validationErr) {
        console.warn('⚠️ Could not pre-validate slot, proceeding anyway');
      }
      
      // STEP 4: Submit booking to backend
      console.log('📤 Sending booking request to backend...');
      await api.post('/bookings', { game, ground, date, time, teamMembers });
      
      console.log('✅ Booking created successfully!');
      
      // STEP 5: Overlay is already showing, now stop loading state
      setOverlayLoading(false);
      setSubmitting(false);
      
      console.log('🎉 Overlay will auto-redirect in 2.5 seconds');
      
      // Clear any previous errors
      setError('');
      
    } catch (err: any) {
      console.error('❌ Booking submission failed:', err);
      
      const statusCode = err?.response?.status;
      const msg = err?.response?.data?.message || 'Failed to submit booking. Please try again.';
      
      // Hide overlay on error
      setSuccessOverlay(false);
      setOverlayLoading(false);
      setSubmitting(false);
      
      // Handle conflict error (409)
      if (statusCode === 409) {
        setError(msg); // User-friendly message from backend
        console.warn('⚠️ Slot conflict detected');
        
        // Refresh slots to show updated availability
        try {
          const { data } = await api.get('/bookings/availability', { params: { date, ground } });
          setSlots(data?.data?.slots || []);
          console.log('♻️ Slots refreshed after conflict');
        } catch (refreshErr) {
          console.error('Failed to refresh slots');
        }
      } else {
        setError(msg);
      }
    }
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
            <button className="btn btn-primary" disabled={submitting} onClick={()=> setReviewOpen(true)}>Review Details</button>
          </div>
        </div>
      )}

      {/* Review/Confirmation Modal - Before Submit */}
      {reviewOpen && !successOverlay && (
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
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Success Overlay - After Submit */}
      {successOverlay && (() => {
        console.log('🎨 Rendering success overlay - Loading:', overlayLoading);
        return true;
      })() && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-scale-in">
            
            {overlayLoading ? (
              /* Loading State */
              <>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Confirming Booking...
                  </h2>
                  <p className="text-sm text-gray-600">
                    Please wait while we process your request.
                  </p>
                </div>
              </>
            ) : (
              /* Success State */
              <>
                {/* Animated Checkmark */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-bounce-once shadow-lg">
                      <svg className="w-12 h-12 text-white animate-check-draw" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 rounded-full bg-green-400 opacity-30 animate-ping"></div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
                    ✅ Booking Confirmed!
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    Your booking has been submitted successfully and is waiting for admin approval.
                  </p>
                  <p className="text-xs text-gray-500">
                    Redirecting to Booking History...
                  </p>
                </div>
              </>
            )}

            {/* Booking Summary */}
            {confirmation && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border border-blue-100 shadow-sm">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Booking Summary</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-base">🏆</span> Sport:
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{confirmation.game}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-base">📍</span> Ground:
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{confirmation.ground}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-base">📅</span> Date:
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{formatDate(confirmation.date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-base">⏰</span> Time:
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{confirmation.time}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button - Only show when not loading */}
            {!overlayLoading && (
              <button 
                className="w-full px-6 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                onClick={() => { 
                  console.log('👆 Manual redirect clicked');
                  setGame('');
                  setGround('');
                  setDate('');
                  setTime('');
                  setTeamMembers([]);
                  setSuccessOverlay(false);
                  setOverlayLoading(false);
                  setConfirmation(null);
                  onSuccess(); // Call parent handler before redirect
                  router.push('/history'); 
                }}
              >
                Go to History →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

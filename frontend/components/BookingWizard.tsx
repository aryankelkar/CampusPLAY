import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Check, 
  ChevronRight, 
  ArrowRight, 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  AlertCircle,
  Trophy,
  MapPin,
  CheckCircle2,
  Sparkles,
  Loader2,
  Dumbbell
} from 'lucide-react';
import api from '../lib/api';
import { GAMES, GROUNDS, TIME_SLOTS, BOOKING_STATUS, MAX_TEAM_MEMBERS, ALLOWED_EMAIL_DOMAIN } from '../constants';
import { getFacilityLabelForSport, getCompatibleFacilities } from '../utils/facilityConfig';
import { getTodayDate, extractSlotHour } from '../utils/helpers';
import { useSocket } from '../context/SocketContext';

export default function BookingWizard({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const [me, setMe] = useState<any>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selections
  const [game, setGame] = useState('');
  const [ground, setGround] = useState('');
  const [date, setDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ name: string; roll: string; email: string }[]>([]);
  const [equipmentList, setEquipmentList] = useState<{ _id: string; name: string; category: string; availableQuantity?: number }[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<{ equipmentId: string; name: string; quantity: number }[]>([]);

  const [slots, setSlots] = useState<{ slot: string; status: 'Vacant' | 'Booked' | 'Reserved'; bookedBy?: string | null; game?: string | null }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<{ game: string; ground: string; date: string; time: string } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (isMounted) setMe(data?.data?.user || null);
        const { data: eqData } = await api.get('/equipment');
        if (isMounted) setEquipmentList(eqData?.data?.equipment || []);
      } catch {
        if (isMounted) router.replace('/login');
      }
    };
    load();
    return () => { isMounted = false; };
  }, [router]);

  const formatDate = (isoDate: string): string => {
    try {
      if (!isoDate) return '';
      const d = new Date(isoDate + 'T00:00:00');
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoDate;
    }
  };

  // Auto-redirect after overlay appears
  useEffect(() => {
    if (!successOverlay || overlayLoading) return;
    const redirectTimer = setTimeout(() => {
      setGame('');
      setGround('');
      setDate('');
      setSelectedSlots([]);
      setTeamMembers([]);
      setSuccessOverlay(false);
      setConfirmation(null);
      setOverlayLoading(false);
      onSuccess();
      router.push('/history');
    }, 2500);
    return () => clearTimeout(redirectTimer);
  }, [successOverlay, overlayLoading, router, onSuccess]);

  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isToday = useMemo(() => date === minDate, [date, minDate]);
  const currentHour = useMemo(() => new Date().getHours(), []);

  const slotStartHour = (label: string): number => {
    const [start, endPart] = label.split('–');
    const [startRaw, ampm] = start.split(' ');
    let h = parseInt(startRaw, 10);
    const isPM = (ampm || (endPart.includes('PM') ? 'PM' : 'AM')).includes('PM');
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h;
  };

  const canGoNextFrom1 = Boolean(game && ground);
  const canGoNextFrom2 = Boolean(date && selectedSlots.length > 0);

  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      if (!date || !ground) return;
      try {
        setLoadingSlots(true);
        const { data } = await api.get('/bookings/availability', { params: { date, ground } });
        if (isMounted) setSlots(data?.data?.slots || []);
      } catch {
        if (isMounted) setSlots([]);
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };
    fetchSlots();
    return () => { isMounted = false; };
  }, [date, ground]);

  // Real-time slot updates via Socket.io
  useEffect(() => {
    if (!socket || !date || !ground) return;
    const handleBookingUpdate = (data: any) => {
      const booking = data?.booking;
      if (!booking || (booking.ground === ground && booking.date === date)) {
        api.get('/bookings/availability', { params: { date, ground } })
          .then(({ data }) => { setSlots(data?.data?.slots || []); })
          .catch(() => {});
      }
    };

    socket.on('booking:created', handleBookingUpdate);
    socket.on('booking:approved', handleBookingUpdate);
    socket.on('booking:rejected', handleBookingUpdate);
    socket.on('booking:revoked', handleBookingUpdate);
    socket.on('booking:cancelled', handleBookingUpdate);
    socket.on('booking:deleted', handleBookingUpdate);

    return () => {
      socket.off('booking:created', handleBookingUpdate);
      socket.off('booking:approved', handleBookingUpdate);
      socket.off('booking:rejected', handleBookingUpdate);
      socket.off('booking:revoked', handleBookingUpdate);
      socket.off('booking:cancelled', handleBookingUpdate);
      socket.off('booking:deleted', handleBookingUpdate);
    };
  }, [socket, date, ground]);

  const scrollToTop = () => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  const nextStep = () => {
    setStep((s) => {
      const v = (Math.min(3, s + 1) as 1 | 2 | 3);
      setTimeout(scrollToTop, 10);
      return v;
    });
  };
  
  const prevStep = () => {
    setStep((s) => {
      const v = (Math.max(1, s - 1) as 1 | 2 | 3);
      setTimeout(scrollToTop, 10);
      return v;
    });
  };

  const validateTeam = (): string | null => {
    if (teamMembers.length > MAX_TEAM_MEMBERS) return `You can add up to ${MAX_TEAM_MEMBERS} teammates (${MAX_TEAM_MEMBERS + 1} players including you).`;
    const seenRolls = new Set<string>();
    const seenEmails = new Set<string>();
    for (const m of teamMembers) {
      if (!m.name || !m.roll || !m.email) return 'All teammates require a name, roll number, and email.';
      if (!m.email.endsWith(ALLOWED_EMAIL_DOMAIN)) return `All teammate emails must end with ${ALLOWED_EMAIL_DOMAIN}`;
      if (seenRolls.has(m.roll) || seenEmails.has(m.email)) return 'Duplicate teammate roll number or email.';
      seenRolls.add(m.roll);
      seenEmails.add(m.email);
      if (me?.roll && m.roll === me.roll) return 'Teammate roll number cannot be the same as your student roll.';
      if (me?.email && m.email === me.email) return 'Teammate email cannot be the same as your student email.';
    }
    return null;
  };

  const submit = async () => {
    if (submitting || successOverlay) return;

    setError(''); 
    const teamErr = validateTeam();
    if (teamErr) { 
      setError(teamErr); 
      setStep(3); 
      setReviewOpen(false); 
      return; 
    }
    
    try {
      setSubmitting(true);
      const bookingDetails = { game, ground, date, time: selectedSlots.join(', ') };
      setConfirmation(bookingDetails);
      
      setReviewOpen(false);
      setOverlayLoading(true);
      setSuccessOverlay(true);
      
      try {
        const { data: availData } = await api.get('/bookings/availability', {
          params: { ground, date }
        });
        
        const bookedSelectedSlots = selectedSlots.filter(slot => {
          const slotData = availData?.data?.slots?.find((s: any) => s.slot === slot);
          return slotData?.status === 'Booked';
        });
        
        if (bookedSelectedSlots.length > 0) {
          setSuccessOverlay(false);
          setOverlayLoading(false);
          setError(`⚠️ The following slot(s) were just booked: ${bookedSelectedSlots.join(', ')}. Please select available time slots.`);
          setSubmitting(false);
          const { data } = await api.get('/bookings/availability', { params: { date, ground } });
          setSlots(data?.data?.slots || []);
          return;
        }
      } catch {}
      
      const { data: gData } = await api.post('/bookings', { game, ground, date, timeSlots: selectedSlots, teamMembers });
      
      // Submit optional equipment reservations linked to ground booking
      if (selectedEquipment.length > 0) {
        const createdGroundBookingId = gData?.data?.booking?._id;
        const colTime = selectedSlots[0] || '8–9 AM';
        const retTime = selectedSlots[selectedSlots.length - 1] || '9–10 AM';
        for (const item of selectedEquipment) {
          if (item.quantity > 0) {
            await api.post('/equipment-bookings', {
              equipmentId: item.equipmentId,
              quantity: item.quantity,
              date,
              collectionTime: colTime,
              returnTime: retTime,
              groundBookingId: createdGroundBookingId
            }).catch(() => {});
          }
        }
      }
      
      setOverlayLoading(false);
      setSubmitting(false);
      setError('');
      
    } catch (err: any) {
      const statusCode = err?.response?.status;
      const msg = err?.response?.data?.message 
        || (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.map((e: any) => e.msg || e.message || e).join(', ') : null)
        || 'Failed to submit booking. Please try again.';
      
      setSuccessOverlay(false);
      setOverlayLoading(false);
      setSubmitting(false);
      
      if (statusCode === 409) {
        setError(msg);
        try {
          const { data } = await api.get('/bookings/availability', { params: { date, ground } });
          setSlots(data?.data?.slots || []);
        } catch {}
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full font-inter">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-4 top-20 z-50 rounded-[12px] bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Progress Stepper Header */}
      <div className="mb-6 pb-6 border-b border-[#E8EEF5]">
        <div className="flex items-center justify-between max-w-xl mx-auto px-2">
          {[
            { num: 1, title: 'Sport & Ground', icon: Trophy },
            { num: 2, title: 'Date & Slot', icon: Clock },
            { num: 3, title: 'Squad & Confirm', icon: Users }
          ].map((s, i) => {
            const IconComp = s.icon;
            const isCurrent = step === s.num;
            const isCompleted = step > s.num;
            
            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center mx-auto text-center">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/25 ring-4 ring-[#2563EB]/15' 
                      : isCompleted 
                        ? 'bg-[#2563EB] text-white' 
                        : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
                  }`}>
                    {isCompleted ? <Check size={18} strokeWidth={3} /> : `0${s.num}`}
                  </div>
                  <span className={`text-[11px] mt-2 font-bold uppercase tracking-wider transition-colors ${
                    isCurrent ? 'text-[#2563EB]' : isCompleted ? 'text-[#0F172A]' : 'text-[#94A3B8]'
                  }`}>
                    {s.title}
                  </span>
                </div>
                
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-2 sm:mx-4 -mt-5 transition-colors duration-300 ${
                    step > s.num ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-3">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* STEP 1: SPORT & GROUND SELECTION */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Sport Selection */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Trophy size={16} className="text-[#2563EB]" />
                <span>Choose Your Sport</span>
              </label>
              <span className="text-xs font-semibold text-[#52657A]">Select 1 sport</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GAMES.map((g) => {
                const isSelected = game === g;
                return (
                  <button 
                    key={g} 
                    type="button" 
                    onClick={() => {
                      setGame(g);
                      const compatible = getCompatibleFacilities(g);
                      if (!compatible.some(f => f.name === ground)) {
                        setGround('');
                      }
                    }}
                    className={`p-4 rounded-[16px] border text-left transition-all duration-200 flex flex-col justify-between h-[100px] ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] shadow-[inset_0_2px_4px_rgba(37,99,235,0.06)] ring-2 ring-[#2563EB]/20'
                        : 'border-[#E8EEF5] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#93B4F4] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-bold text-sm sm:text-base ${isSelected ? 'text-[#1D4ED8]' : 'text-[#0F172A]'}`}>{g}</span>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-[#CBD5E1] bg-white" />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-[#52657A]">
                      {isSelected ? 'Selected' : 'Available'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Facility Selection */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <MapPin size={16} className="text-[#2563EB]" />
                <span>{getFacilityLabelForSport(game)}</span>
              </label>
              <span className="text-xs font-semibold text-[#52657A]">
                {game ? `Available for ${game}` : 'Select sport first'}
              </span>
            </div>
            
            {!game ? (
              <div className="p-6 rounded-[16px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center text-xs font-semibold text-[#64748B]">
                Please select a sport above to view compatible facilities.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getCompatibleFacilities(game).map((fac) => {
                  const isSelected = ground === fac.name;
                  const isMaintenance = fac.status === 'MAINTENANCE';

                  return (
                    <button 
                      key={fac.name} 
                      type="button" 
                      disabled={isMaintenance}
                      onClick={() => setGround(fac.name)}
                      className={`p-4 rounded-[16px] border text-left transition-all duration-200 flex items-center justify-between ${
                        isMaintenance
                          ? 'border-[#E2E8F0] bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed opacity-75'
                          : isSelected
                            ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] shadow-[inset_0_2px_4px_rgba(37,99,235,0.06)] ring-2 ring-[#2563EB]/20'
                            : 'border-[#E8EEF5] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#93B4F4] shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`font-bold text-sm sm:text-base ${isSelected ? 'text-[#1D4ED8]' : 'text-[#0F172A]'}`}>{fac.name}</div>
                          {isMaintenance && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">
                              Maintenance
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#52657A] mt-0.5 font-medium">{fac.location} • {fac.capacity}</div>
                      </div>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-[#CBD5E1] bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 1 Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-[#E8EEF5]">
            <button
              className="btn btn-primary px-6 py-3 text-xs font-extrabold uppercase tracking-wider rounded-[12px] flex items-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all"
              disabled={!canGoNextFrom1}
              onClick={nextStep}
            >
              <span>CONTINUE TO DATE & SLOT</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: DATE & TIME SLOT SELECTION */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Selected Context Summary Chip */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[14px] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1D4ED8]">
              <Trophy size={16} />
              <span>{game}</span>
              <span className="text-[#93B4F4]">•</span>
              <MapPin size={16} />
              <span>{ground}</span>
            </div>
            <button 
              onClick={() => setStep(1)} 
              className="text-xs font-bold text-[#2563EB] hover:underline"
            >
              Change
            </button>
          </div>

          {/* Date Selector */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <CalendarIcon size={16} className="text-[#2563EB]" />
                <span>Select Booking Date</span>
              </label>
              <span className="text-xs font-semibold text-[#52657A]">Hours: 08:00 AM – 07:00 PM</span>
            </div>
            
            <input 
              className="input text-sm font-semibold py-2.5 w-full rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs" 
              type="date" 
              min={minDate} 
              value={date} 
              onChange={(e) => { setDate(e.target.value); setSelectedSlots([]); }} 
            />
            {date && (
              <p className="mt-1.5 text-xs font-semibold text-[#2563EB]">
                Selected Date: <span className="font-bold">{formatDate(date)}</span>
              </p>
            )}
          </div>

          {/* Time Slot Legend */}
          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold border-y border-[#E8EEF5] py-2.5">
            <span className="text-[#0F172A] font-bold">Legend:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-white border-2 border-[#2563EB]" /> 
              <span className="text-[#0F172A]">Available</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#2563EB]" /> 
              <span className="text-[#2563EB] font-bold">Selected</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#D97706]" /> 
              <span className="text-[#D97706] font-bold">Reserved</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#CBD5E1]" /> 
              <span className="text-[#64748B]">Booked / Past</span>
            </span>
          </div>

          {/* Time Slots Grid */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Clock size={16} className="text-[#2563EB]" />
                <span>Available Time Slots</span>
              </label>
              <div className="text-xs font-bold text-[#2563EB]">
                {!date ? 'Pick a date first' : `Selected (${selectedSlots.length}/2 slots)`}
              </div>
            </div>

            {loadingSlots ? (
              <div className="p-8 text-center bg-white rounded-[16px] border border-[#E8EEF5] flex items-center justify-center gap-3">
                <Loader2 size={20} className="animate-spin text-[#2563EB]" />
                <span className="text-xs font-semibold text-[#52657A]">Checking available slots...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TIME_SLOTS.map((slot) => {
                  const info = slots.find(s => s.slot === slot);
                  const status = info?.status || 'Vacant';
                  const isReserved = status === 'Reserved';
                  const isBooked = status === 'Booked';
                  const blockedByBooking = isBooked || isReserved;
                  const hour = slotStartHour(slot);
                  const blockedByTime = isToday && hour <= currentHour;
                  const blocked = blockedByBooking || blockedByTime;
                  const isSelected = selectedSlots.includes(slot);
                  const canSelect = !blocked && (isSelected || selectedSlots.length < 2);
                  
                  return (
                    <button 
                      key={slot} 
                      type="button"
                      disabled={!date || !canSelect || blocked}
                      title={isReserved ? 'Reserved by another booking' : isBooked ? 'Booked' : ''}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSlots(selectedSlots.filter(s => s !== slot));
                        } else if (selectedSlots.length < 2) {
                          setSelectedSlots([...selectedSlots, slot]);
                        }
                      }}
                      className={`p-3 rounded-[14px] border text-left transition-all duration-200 ${
                        isSelected 
                          ? 'border-[#1D4ED8] bg-[#2563EB] text-white shadow-md font-bold' 
                          : isReserved
                            ? 'bg-[#FEF3C7] border-[#FCD34D] text-[#92400E] cursor-not-allowed opacity-80'
                            : blocked 
                              ? 'bg-[#F1F5F9] border-[#CBD5E1] text-[#94A3B8] opacity-60 cursor-not-allowed' 
                              : 'bg-white border-[#E8EEF5] text-[#0F172A] hover:border-[#2563EB] hover:bg-[#EFF6FF]'
                      } disabled:cursor-not-allowed`}
                    >
                      <div className={`font-bold text-xs ${isSelected ? 'text-white' : isReserved ? 'text-[#92400E]' : 'text-[#0F172A]'}`}>{slot}</div>
                      <div className="text-[10px] mt-1 font-semibold flex items-center gap-1">
                        {isSelected ? (
                          <span className="text-white flex items-center gap-1">✓ SELECTED</span>
                        ) : isReserved ? (
                          <span className="text-[#D97706] font-bold">RESERVED</span>
                        ) : isBooked ? (
                          <span className="text-[#94A3B8]">BOOKED</span>
                        ) : blockedByTime ? (
                          <span className="text-[#94A3B8]">PAST</span>
                        ) : (
                          <span className="text-[#2563EB]">AVAILABLE</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2 Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E8EEF5]">
            <button 
              className="btn btn-outline px-4 py-2.5 rounded-[12px] text-xs font-bold uppercase text-[#52657A] bg-white border border-[#DCE6F0] hover:bg-[#EFF6FF] flex items-center gap-1.5"
              onClick={prevStep}
            >
              <ArrowLeft size={16} />
              <span>BACK</span>
            </button>
            <button 
              className="btn btn-primary px-6 py-3 text-xs font-extrabold uppercase tracking-wider rounded-[12px] flex items-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all" 
              disabled={!canGoNextFrom2} 
              onClick={nextStep}
            >
              <span>CONTINUE TO SQUAD</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: SQUAD & CONFIRM */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Reservation Summary Box */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[18px] p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between border-b border-[#BFDBFE] pb-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#1D4ED8] flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>Reservation Summary</span>
              </div>
              <button onClick={() => setStep(1)} className="text-xs font-bold text-[#2563EB] hover:underline">Edit</button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#52657A] block text-[10px] uppercase font-bold mb-0.5">Sport</span>
                <span className="font-extrabold text-[#0F172A] text-sm">{game}</span>
              </div>
              <div>
                <span className="text-[#52657A] block text-[10px] uppercase font-bold mb-0.5">Ground</span>
                <span className="font-extrabold text-[#0F172A] text-sm">{ground}</span>
              </div>
              <div>
                <span className="text-[#52657A] block text-[10px] uppercase font-bold mb-0.5">Date</span>
                <span className="font-extrabold text-[#0F172A] text-sm">{formatDate(date)}</span>
              </div>
              <div>
                <span className="text-[#52657A] block text-[10px] uppercase font-bold mb-0.5">Time Slots</span>
                <span className="font-extrabold text-[#2563EB] text-sm">{selectedSlots.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Squad & Teammates */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Users size={16} className="text-[#2563EB]" />
                <span>Squad & Teammates</span>
              </label>
              <span className="text-xs font-semibold text-[#52657A]">Add up to {MAX_TEAM_MEMBERS} teammates</span>
            </div>
            
            {/* Primary Applicant Info Box */}
            <div className="bg-white rounded-[16px] border border-[#E8EEF5] p-4 mb-3 shadow-xs">
              <div className="text-[11px] font-extrabold text-[#2563EB] uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldCheck size={14} />
                <span>Primary Applicant (You)</span>
              </div>
              <div className="text-sm font-extrabold text-[#0F172A]">{me?.name}</div>
              <div className="text-xs text-[#52657A] mt-0.5 font-medium">
                {me?.roll} • {me?.branch} • Div {me?.division} • Year {me?.classYear}
              </div>
              <div className="text-xs text-[#52657A] font-medium">{me?.email}</div>
            </div>
            
            {/* Teammates List */}
            {teamMembers.map((m, idx) => (
              <div key={idx} className="bg-white rounded-[16px] border border-[#E8EEF5] p-4 mb-3 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-extrabold text-[#0F172A] uppercase">Teammate 0{idx + 1}</div>
                  <button 
                    type="button" 
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1" 
                    onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input 
                    className="input text-xs font-semibold py-2 px-3 rounded-[10px] border border-[#DCE6F0]" 
                    placeholder="Full Name" 
                    value={m.name} 
                    onChange={(e) => {
                      const arr = [...teamMembers]; 
                      arr[idx] = { ...arr[idx], name: e.target.value }; 
                      setTeamMembers(arr);
                    }} 
                  />
                  <input 
                    className="input text-xs font-semibold uppercase py-2 px-3 rounded-[10px] border border-[#DCE6F0]" 
                    placeholder="Roll Number (e.g. 24CS101)" 
                    value={m.roll} 
                    onChange={(e) => {
                      const arr = [...teamMembers]; 
                      arr[idx] = { ...arr[idx], roll: e.target.value.toUpperCase() }; 
                      setTeamMembers(arr);
                    }} 
                  />
                  <input 
                    className="input text-xs font-semibold py-2 px-3 rounded-[10px] border border-[#DCE6F0]" 
                    placeholder={`Email (${ALLOWED_EMAIL_DOMAIN})`} 
                    type="email"
                    value={m.email} 
                    onChange={(e) => {
                      const arr = [...teamMembers]; 
                      arr[idx] = { ...arr[idx], email: e.target.value }; 
                      setTeamMembers(arr);
                    }} 
                  />
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-between mt-3">
              <button 
                type="button" 
                className="btn btn-outline px-4 py-2 text-xs font-bold rounded-[10px] text-[#2563EB] bg-white border border-[#DCE6F0] hover:bg-[#EFF6FF] flex items-center gap-1.5 disabled:opacity-50" 
                onClick={() => { if (teamMembers.length < MAX_TEAM_MEMBERS) setTeamMembers([...teamMembers, { name: '', roll: '', email: '' }]); }}
                disabled={teamMembers.length >= MAX_TEAM_MEMBERS}
              >
                <UserPlus size={14} />
                <span>+ Add Teammate</span>
              </button>
              <div className="text-xs font-semibold text-[#52657A]">({teamMembers.length}/{MAX_TEAM_MEMBERS} teammates)</div>
            </div>
          </div>

          {/* Optional Equipment Selection */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[18px] p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Dumbbell size={16} className="text-[#2563EB]" />
                <span>Equipment Add-on (Optional)</span>
              </label>
              <span className="text-[11px] font-bold text-[#2563EB] bg-[#DBEAFE] px-2 py-0.5 rounded-full">
                OPTIONAL
              </span>
            </div>
            
            <p className="text-xs text-[#64748B] mb-3">
              Need sports equipment for your match? Add items below to reserve them automatically.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {equipmentList.slice(0, 6).map((eq) => {
                const existing = selectedEquipment.find(i => i.equipmentId === eq._id);
                const qty = existing?.quantity || 0;

                return (
                  <div key={eq._id} className="p-3 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-[#0F172A]">{eq.name}</div>
                      <div className="text-[10px] text-[#64748B] font-medium">{eq.category}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={qty <= 0}
                        onClick={() => {
                          if (qty <= 1) {
                            setSelectedEquipment(selectedEquipment.filter(i => i.equipmentId !== eq._id));
                          } else {
                            setSelectedEquipment(selectedEquipment.map(i => i.equipmentId === eq._id ? { ...i, quantity: qty - 1 } : i));
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] font-extrabold text-xs flex items-center justify-center disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="text-xs font-extrabold text-[#0F172A] w-5 text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (existing) {
                            setSelectedEquipment(selectedEquipment.map(i => i.equipmentId === eq._id ? { ...i, quantity: qty + 1 } : i));
                          } else {
                            setSelectedEquipment([...selectedEquipment, { equipmentId: eq._id, name: eq.name, quantity: 1 }]);
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] font-extrabold text-xs flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3 Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E8EEF5]">
            <button 
              className="btn btn-outline px-4 py-2.5 rounded-[12px] text-xs font-bold uppercase text-[#52657A] bg-white border border-[#DCE6F0] hover:bg-[#EFF6FF] flex items-center gap-1.5" 
              onClick={prevStep}
            >
              <ArrowLeft size={16} />
              <span>BACK</span>
            </button>
            <button 
              className="btn btn-primary px-6 py-3 text-xs font-extrabold uppercase tracking-wider rounded-[12px] flex items-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all" 
              disabled={submitting} 
              onClick={() => setReviewOpen(true)}
            >
              <span>REVIEW RESERVATION</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* Review / Confirmation Modal */}
      {reviewOpen && !successOverlay && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0F172A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[22px] p-6 shadow-2xl border border-[#E8EEF5] animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-extrabold text-[#0F172A] mb-1">Review Reservation</h3>
            <p className="text-xs text-[#52657A] mb-4">Please confirm your booking details before submitting for admin approval.</p>
            
            {error && (
              <div className="mb-4 rounded-[12px] border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-3 mb-6 bg-[#EFF6FF] p-4 rounded-[16px] border border-[#BFDBFE]">
              <div className="flex justify-between text-xs">
                <span className="text-[#52657A]">Sport:</span>
                <span className="font-extrabold text-[#0F172A]">{game}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#52657A]">Ground:</span>
                <span className="font-extrabold text-[#0F172A]">{ground}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#52657A]">Date:</span>
                <span className="font-extrabold text-[#0F172A]">{formatDate(date)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#52657A]">Time Slots:</span>
                <span className="font-extrabold text-[#2563EB]">{selectedSlots.join(', ')}</span>
              </div>
              {selectedEquipment.length > 0 && (
                <div className="flex justify-between text-xs pt-2 border-t border-[#BFDBFE]">
                  <span className="text-[#52657A]">Equipment:</span>
                  <span className="font-extrabold text-[#2563EB]">
                    {selectedEquipment.map(e => `${e.name} × ${e.quantity}`).join(', ')}
                  </span>
                </div>
              )}
              {teamMembers.length > 0 && (
                <div className="flex justify-between text-xs pt-2 border-t border-[#BFDBFE]">
                  <span className="text-[#52657A]">Teammates:</span>
                  <span className="font-extrabold text-[#0F172A]">{teamMembers.length} added</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                className="btn btn-outline flex-1 py-3 rounded-[12px] text-xs font-bold uppercase text-[#52657A] bg-white border border-[#DCE6F0] hover:bg-[#EFF6FF]"
                onClick={() => { setReviewOpen(false); setError(''); }}
                disabled={submitting}
              >
                CANCEL
              </button>
              <button 
                className="btn btn-primary flex-1 py-3 rounded-[12px] text-xs font-extrabold uppercase tracking-wider text-white shadow-md"
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? 'SUBMITTING...' : 'CONFIRM BOOKING'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success / Submission State Overlay */}
      {successOverlay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[22px] p-6 text-center border border-[#E8EEF5] shadow-2xl animate-in zoom-in-95 duration-200">
            
            {overlayLoading ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin" />
                </div>
                <div className="mb-4">
                  <h3 className="text-lg font-extrabold text-[#0F172A] mb-1">
                    SUBMITTING BOOKING...
                  </h3>
                  <p className="text-xs text-[#52657A]">
                    Processing your ground reservation request.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg animate-in scale-90 duration-300">
                    <Check size={32} strokeWidth={3} />
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-extrabold text-[#0F172A] mb-1 tracking-tight">
                    BOOKING SUBMITTED
                  </h3>
                  <p className="text-xs text-[#52657A] leading-relaxed mb-2">
                    Your ground reservation request has been submitted and is awaiting admin approval.
                  </p>
                  <p className="text-xs text-[#2563EB] font-bold">
                    Redirecting to My History...
                  </p>
                </div>
              </>
            )}

            {confirmation && (
              <div className="bg-[#EFF6FF] rounded-[16px] p-4 mb-4 border border-[#BFDBFE] text-left">
                <div className="text-[11px] font-extrabold text-[#1D4ED8] uppercase mb-2">Reservation Summary</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#52657A]">Sport:</span>
                    <span className="font-extrabold text-[#0F172A]">{confirmation.game}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#52657A]">Ground:</span>
                    <span className="font-extrabold text-[#0F172A]">{confirmation.ground}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#52657A]">Date:</span>
                    <span className="font-extrabold text-[#0F172A]">{formatDate(confirmation.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#52657A]">Time:</span>
                    <span className="font-extrabold text-[#2563EB]">{confirmation.time}</span>
                  </div>
                </div>
              </div>
            )}

            {!overlayLoading && (
              <button 
                className="btn btn-primary w-full py-3 rounded-[12px] text-xs font-extrabold uppercase tracking-wider text-white shadow-md"
                onClick={() => { 
                  setGame('');
                  setGround('');
                  setDate('');
                  setSelectedSlots([]);
                  setTeamMembers([]);
                  setSuccessOverlay(false);
                  setOverlayLoading(false);
                  setConfirmation(null);
                  onSuccess();
                  router.push('/history'); 
                }}
              >
                GO TO MY HISTORY →
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

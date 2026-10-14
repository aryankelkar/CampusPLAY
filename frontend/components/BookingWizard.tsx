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
  Dumbbell,
  Phone,
  PhoneCall,
  GraduationCap,
  Lock,
  X,
  User,
  Mail
} from 'lucide-react';
import api from '../lib/api';
import { BRANCHES, DIVISIONS, CLASS_YEARS, GAMES, GROUNDS, TIME_SLOTS, BOOKING_STATUS, MAX_TEAM_MEMBERS, ALLOWED_EMAIL_DOMAIN } from '../constants';
import { getFacilityLabelForSport, getCompatibleFacilities } from '../utils/facilityConfig';
import { getTodayDate, extractSlotHour } from '../utils/helpers';
import { useSocket } from '../context/SocketContext';

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

export default function BookingWizard({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const [me, setMe] = useState<any>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Student Contact & Academic Information State
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [branch, setBranch] = useState('INFT');
  const [classYear, setClassYear] = useState('SE');
  const [division, setDivision] = useState('A');
  const [semester, setSemester] = useState('3');
  const [roll, setRoll] = useState('');
  const [isProfileVerified, setIsProfileVerified] = useState(false);

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
        const { data } = await api.get('/api/auth/me');
        if (isMounted) {
          const user = data?.data?.user;
          setMe(user || null);
          if (user) {
            if (user.phone) setPhone(user.phone);
            if (user.alternatePhone) setAlternatePhone(user.alternatePhone);
            if (user.roll) setRoll(user.roll);
            if (user.branch) setBranch(user.branch);
            if (user.classYear) setClassYear(user.classYear);
            if (user.division) setDivision(user.division);
            if (user.semester) setSemester(String(user.semester));
            else if (user.classYear === 'FE') setSemester('1');
            else if (user.classYear === 'SE') setSemester('3');
            else if (user.classYear === 'TE') setSemester('5');
            else if (user.classYear === 'BE') setSemester('7');
            setIsProfileVerified(Boolean(user.academicProfileVerified));
          }
        }
        const { data: eqData } = await api.get('/api/equipment');
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

  const normalizePhoneNumber = (raw: string): string => {
    let clean = (raw || '').trim().replace(/[\s\-\(\)]/g, '');
    if (clean.startsWith('+91')) clean = clean.substring(3);
    else if (clean.startsWith('91') && clean.length === 12) clean = clean.substring(2);
    else if (clean.startsWith('0') && clean.length === 11) clean = clean.substring(1);
    return clean;
  };

  const validateStudentDetails = (): string | null => {
    // 1. Primary Phone validation
    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone) {
      return 'Primary mobile number is required.';
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return 'Please enter a valid 10-digit Indian mobile number (must start with 6, 7, 8, or 9).';
    }
    if (/^(\d)\1{9}$/.test(cleanPhone)) {
      return 'Mobile number cannot be all identical digits.';
    }

    // 2. Optional Alternate Phone validation
    if (alternatePhone && alternatePhone.trim()) {
      const cleanAlt = normalizePhoneNumber(alternatePhone);
      if (!/^[6-9]\d{9}$/.test(cleanAlt)) {
        return 'Alternate mobile number must be a valid 10-digit Indian mobile number.';
      }
      if (/^(\d)\1{9}$/.test(cleanAlt)) {
        return 'Alternate mobile number cannot be all identical digits.';
      }
      if (cleanAlt === cleanPhone) {
        return 'Alternate mobile number must be different from primary mobile number.';
      }
    }

    // 3. Academic validation (if unverified, check required values)
    if (!isProfileVerified) {
      const activeRoll = roll.trim() || me?.roll?.trim() || '';
      if (!activeRoll) {
        return 'College roll number is required.';
      }
      if (!/^[A-Za-z0-9]{1,10}$/.test(activeRoll)) {
        return 'College roll number must be alphanumeric (max 10 characters).';
      }
      if (!branch || !BRANCHES.includes(branch as any)) {
        return 'Please select a valid engineering branch.';
      }
      if (!classYear || !CLASS_YEARS.includes(classYear as any)) {
        return 'Please select a valid academic year.';
      }
      const allowedSemesters = SEMESTERS_BY_YEAR[classYear] || [];
      const semNum = Number(semester);
      if (!allowedSemesters.includes(semNum)) {
        return `Semester ${semester} is not valid for ${YEAR_TITLES[classYear] || classYear}. Valid semesters: ${allowedSemesters.join(', ')}.`;
      }
      if (!division || !DIVISIONS.includes(division as any)) {
        return 'Please select a valid division.';
      }
    }

    return null;
  };

  const submit = async () => {
    if (submitting || successOverlay) return;

    setError('');
    const studentErr = validateStudentDetails();
    if (studentErr) {
      setError(studentErr);
      setStep(3);
      setReviewOpen(false);
      return;
    }

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

      const cleanPhone = normalizePhoneNumber(phone);
      const cleanAlt = alternatePhone.trim() ? normalizePhoneNumber(alternatePhone) : undefined;
      
      const { data: gData } = await api.post('/bookings', { 
        game, 
        ground, 
        date, 
        timeSlots: selectedSlots, 
        teamMembers,
        phone: cleanPhone,
        alternatePhone: cleanAlt,
        branch,
        classYear,
        division,
        semester: Number(semester),
        roll: (roll || me?.roll || '').trim().toUpperCase(),
      });
      
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

      {/* STEP 3: DETAILS, SQUAD & CONFIRM */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* BANNER HEADER: STUDENT ACADEMIC INFORMATION & CONTACT DETAILS */}
          <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#2563EB] rounded-[20px] p-5 text-white shadow-md border border-[#334155]/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  Official Booking Record
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight mt-1.5 flex items-center gap-2 !text-white text-white">
                  <GraduationCap className="w-5 h-5 text-blue-300 shrink-0" />
                  <span>STUDENT ACADEMIC INFORMATION & CONTACT DETAILS</span>
                </h2>
                <p className="text-xs text-blue-100/80 mt-0.5">
                  Review your authenticated college details and active contact number for admin verification.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isProfileVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Verified Academic Profile
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 1: STUDENT DETAILS */}
          <div className="bg-white rounded-[18px] border border-[#E8EEF5] p-5 shadow-xs">
            <div className="mb-4 pb-3 border-b border-[#E8EEF5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs border border-blue-100">
                  01
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                    SECTION 1: STUDENT DETAILS
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Primary contact information for booking notifications and groundsman authorization.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1.5">
                  Full Name <span className="text-xs text-[#94A3B8] font-normal">(From Profile)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={me?.name || ''}
                  className="w-full text-xs font-semibold py-2.5 px-3 rounded-[10px] bg-slate-50 border border-slate-200 text-[#334155] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1.5">
                  College Email Address <span className="text-xs text-[#94A3B8] font-normal">({ALLOWED_EMAIL_DOMAIN})</span>
                </label>
                <input
                  type="email"
                  readOnly
                  value={me?.email || ''}
                  className="w-full text-xs font-semibold py-2.5 px-3 rounded-[10px] bg-slate-50 border border-slate-200 text-[#334155] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    Mobile Number <span className="text-rose-500 font-bold">*</span>
                  </span>
                  <span className="text-[10px] font-semibold text-[#64748B]">10-digit Indian Number</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B] select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full text-xs font-bold pl-11 pr-3 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-[#0F172A]"
                  />
                </div>
                <p className="text-[10px] text-[#64748B] mt-1">
                  Required for university booking coordination and emergency ground contact.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                    Alternate Mobile Number <span className="text-[#64748B] font-normal">(Optional)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B] select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9123456789 (Optional)"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full text-xs font-bold pl-11 pr-3 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-[#0F172A]"
                  />
                </div>
                <p className="text-[10px] text-[#64748B] mt-1">
                  Secondary contact in case primary number is unreachable.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACADEMIC DETAILS */}
          <div className="bg-white rounded-[18px] border border-[#E8EEF5] p-5 shadow-xs">
            <div className="mb-4 pb-3 border-b border-[#E8EEF5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">
                  02
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                    SECTION 2: ACADEMIC DETAILS
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Academic schedule used for automated timetable conflict verification.
                  </p>
                </div>
              </div>

              {isProfileVerified && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified & Locked (Contact Admin to change)</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1.5">
                  College Roll Number <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  readOnly={isProfileVerified}
                  value={roll}
                  onChange={(e) => setRoll(e.target.value.toUpperCase())}
                  placeholder="e.g. 24IT101"
                  className={`w-full text-xs font-bold py-2.5 px-3 rounded-[10px] border ${
                    isProfileVerified
                      ? 'bg-slate-50 border-slate-200 text-[#334155] cursor-not-allowed'
                      : 'border-[#CBD5E1] bg-white text-[#0F172A] focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1.5">
                  Engineering Branch <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  disabled={isProfileVerified}
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className={`w-full text-xs font-bold py-2.5 px-3 rounded-[10px] border ${
                    isProfileVerified
                      ? 'bg-slate-50 border-slate-200 text-[#334155] cursor-not-allowed'
                      : 'border-[#CBD5E1] bg-white text-[#0F172A] focus:border-indigo-600 outline-none'
                  }`}
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1.5">
                  Academic Year / Year of Study <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  disabled={isProfileVerified}
                  value={classYear}
                  onChange={(e) => {
                    const y = e.target.value;
                    setClassYear(y);
                    const allowed = SEMESTERS_BY_YEAR[y] || [];
                    if (!allowed.includes(Number(semester))) {
                      setSemester(String(allowed[0] || '1'));
                    }
                  }}
                  className={`w-full text-xs font-bold py-2.5 px-3 rounded-[10px] border ${
                    isProfileVerified
                      ? 'bg-slate-50 border-slate-200 text-[#334155] cursor-not-allowed'
                      : 'border-[#CBD5E1] bg-white text-[#0F172A] focus:border-indigo-600 outline-none'
                  }`}
                >
                  {CLASS_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {YEAR_TITLES[y] || y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1.5">
                  Semester <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  disabled={isProfileVerified}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className={`w-full text-xs font-bold py-2.5 px-3 rounded-[10px] border ${
                    isProfileVerified
                      ? 'bg-slate-50 border-slate-200 text-[#334155] cursor-not-allowed'
                      : 'border-[#CBD5E1] bg-white text-[#0F172A] focus:border-indigo-600 outline-none'
                  }`}
                >
                  {(SEMESTERS_BY_YEAR[classYear] || [1, 2]).map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1.5">
                  Division <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  disabled={isProfileVerified}
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className={`w-full text-xs font-bold py-2.5 px-3 rounded-[10px] border ${
                    isProfileVerified
                      ? 'bg-slate-50 border-slate-200 text-[#334155] cursor-not-allowed'
                      : 'border-[#CBD5E1] bg-white text-[#0F172A] focus:border-indigo-600 outline-none'
                  }`}
                >
                  {DIVISIONS.map((d) => (
                    <option key={d} value={d}>
                      Division {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: SPORTS BOOKING */}
          <div className="bg-white rounded-[18px] border border-[#E8EEF5] p-5 shadow-xs space-y-5">
            <div className="pb-3 border-b border-[#E8EEF5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs border border-emerald-100">
                  03
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                    SECTION 3: SPORTS BOOKING
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Sport facility, date, slots, squad roster, and optional sports equipment.
                  </p>
                </div>
              </div>
            </div>

            {/* Reservation Summary Box */}
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[16px] p-4 shadow-xs">
              <div className="mb-2.5 flex items-center justify-between border-b border-[#BFDBFE] pb-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#1D4ED8] flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>Reservation Details</span>
                </div>
                <button onClick={() => setStep(1)} className="text-xs font-bold text-[#2563EB] hover:underline">
                  Change Sport/Ground
                </button>
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
                  <span>Squad Members ({teamMembers.length}/{MAX_TEAM_MEMBERS})</span>
                </label>
                <span className="text-xs font-semibold text-[#52657A]">Add up to {MAX_TEAM_MEMBERS} teammates</span>
              </div>
              
              {/* Primary Applicant Info Box */}
              <div className="bg-[#F8FAFC] rounded-[14px] border border-[#E2E8F0] p-3.5 mb-3">
                <div className="text-[11px] font-extrabold text-[#2563EB] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ShieldCheck size={14} />
                  <span>Primary Applicant (You)</span>
                </div>
                <div className="text-xs font-bold text-[#0F172A]">
                  {me?.name} • Roll: {roll || me?.roll} • {branch} (Year {classYear}, Sem {semester}, Div {division})
                </div>
                <div className="text-[11px] text-[#52657A] mt-0.5">
                  Email: {me?.email} {phone ? `• Mobile: +91 ${phone}` : ''}
                </div>
              </div>
              
              {/* Teammates List */}
              {teamMembers.map((m, idx) => (
                <div key={idx} className="bg-white rounded-[14px] border border-[#E8EEF5] p-3.5 mb-2.5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
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
              
              <div className="flex items-center justify-between mt-2">
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
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-4 shadow-xs">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                  <Dumbbell size={16} className="text-[#2563EB]" />
                  <span>Equipment Add-on (Optional)</span>
                </label>
                <span className="text-[10px] font-bold text-[#2563EB] bg-[#DBEAFE] px-2 py-0.5 rounded-full">
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

          </div>

          {/* Step 3 Footer Navigation */}
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
              onClick={() => {
                setError('');
                const studentErr = validateStudentDetails();
                if (studentErr) {
                  setError(studentErr);
                  scrollToTop();
                  return;
                }
                const teamErr = validateTeam();
                if (teamErr) {
                  setError(teamErr);
                  scrollToTop();
                  return;
                }
                setReviewOpen(true);
              }}
            >
              <span>REVIEW RESERVATION</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* Review / Confirmation Modal */}
      {reviewOpen && !successOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-sm p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* 1. FIXED PINNED HEADER */}
            <div className="px-6 py-4 sm:py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-[#0F172A]">Review Reservation</h3>
                    {isProfileVerified && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified Profile
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#52657A] mt-0.5">Please confirm all booking parameters, student details, and squad roster before submitting.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setReviewOpen(false); setError(''); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Error Banner */}
            {error && (
              <div className="mx-6 mt-4 rounded-[12px] border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2 shrink-0">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* 2. SCROLLABLE BODY */}
            <div className="px-6 py-5 overflow-y-auto space-y-4 flex-1">
              
              {/* SECTION A: SPORTS & FACILITY SCHEDULE */}
              <div className="bg-[#EFF6FF] p-4 rounded-[16px] border border-[#BFDBFE]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#1D4ED8]">
                    <Trophy size={14} className="text-[#2563EB]" />
                    <span>Reservation Schedule</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1D4ED8] border border-blue-200">
                    {selectedSlots.length} {selectedSlots.length === 1 ? 'Slot' : 'Slots'} ({selectedSlots.length} hr{selectedSlots.length > 1 ? 's' : ''})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-white p-3 rounded-[12px] border border-blue-200/60 shadow-2xs">
                    <span className="text-[#52657A] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Sport</span>
                    <span className="font-black text-[#0F172A] text-xs sm:text-sm block truncate">{game}</span>
                  </div>
                  <div className="bg-white p-3 rounded-[12px] border border-blue-200/60 shadow-2xs">
                    <span className="text-[#52657A] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Ground / Court</span>
                    <span className="font-black text-[#0F172A] text-xs sm:text-sm block truncate">{ground}</span>
                  </div>
                  <div className="bg-white p-3 rounded-[12px] border border-blue-200/60 shadow-2xs">
                    <span className="text-[#52657A] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Date</span>
                    <span className="font-black text-[#0F172A] text-xs sm:text-sm block truncate">{formatDate(date)}</span>
                  </div>
                  <div className="bg-white p-3 rounded-[12px] border border-blue-200/60 shadow-2xs">
                    <span className="text-[#52657A] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Time Slot(s)</span>
                    <span className="font-black text-[#2563EB] text-xs sm:text-sm block">{selectedSlots.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* SECTION B: STUDENT PROFILE & CONTACT DETAILS */}
              <div className="bg-slate-50/80 p-4 rounded-[16px] border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700 mb-3">
                  <GraduationCap size={15} className="text-[#2563EB]" />
                  <span>Student & Academic Profile</span>
                </div>

                {/* Academic Fields */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs mb-2.5">
                  <div className="bg-white p-2.5 rounded-[10px] border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Roll Number</span>
                    <span className="font-extrabold text-slate-800 text-xs block truncate">{roll || me?.roll || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-[10px] border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Branch</span>
                    <span className="font-extrabold text-slate-800 text-xs block truncate">{branch || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-[10px] border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Year / Sem</span>
                    <span className="font-extrabold text-slate-800 text-xs block">{classYear} • Sem {semester}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-[10px] border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Division</span>
                    <span className="font-extrabold text-slate-800 text-xs block">Div {division}</span>
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-[10px] border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">College Email</span>
                    <span className="font-bold text-slate-800 text-xs block truncate">{me?.email || '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-[10px] border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Primary Mobile</span>
                    <span className="font-bold text-[#2563EB] text-xs block">+91 {phone}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-[10px] border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Alternate Mobile</span>
                    <span className="font-semibold text-slate-700 text-xs block">{alternatePhone ? `+91 ${alternatePhone}` : 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION C: SQUAD ROSTER (FULL DETAILS) */}
              <div className="bg-white p-4 rounded-[16px] border border-slate-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800">
                    <Users size={14} className="text-[#2563EB]" />
                    <span>Squad Roster ({1 + teamMembers.length} {1 + teamMembers.length === 1 ? 'Player' : 'Players'})</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {teamMembers.length} teammate{teamMembers.length === 1 ? '' : 's'} added
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Primary Applicant Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-[10px] bg-blue-50/70 border border-blue-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#2563EB] text-white">Lead</span>
                      <span className="font-extrabold text-[#0F172A]">{me?.name}</span>
                      <span className="text-[11px] text-slate-500">({roll || me?.roll || '—'})</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{me?.email}</span>
                  </div>

                  {/* Teammates Rows */}
                  {teamMembers.length > 0 ? (
                    teamMembers.map((member, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 rounded-[10px] bg-slate-50 border border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                          <span className="font-bold text-slate-800">{member.name}</span>
                          {member.roll && (
                            <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                              Roll: {member.roll}
                            </span>
                          )}
                        </div>
                        {member.email && (
                          <span className="text-[11px] text-slate-500">{member.email}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic py-1 px-1">
                      Solo reservation — no additional teammates added.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION D: SPORTS EQUIPMENT */}
              <div className="bg-white p-4 rounded-[16px] border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800 mb-2.5">
                  <Dumbbell size={14} className="text-[#2563EB]" />
                  <span>Sports Equipment</span>
                </div>

                {selectedEquipment.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedEquipment.map(e => (
                      <div key={e.equipmentId} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold">
                        <span>{e.name}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-200 text-blue-800 text-[10px] font-black">
                          ×{e.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic px-1">
                    No sports equipment requested with this booking.
                  </div>
                )}
              </div>

            </div>

            {/* 3. FIXED PINNED FOOTER */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 rounded-b-[24px]">
              <button 
                type="button"
                className="btn btn-outline px-5 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-wider text-[#52657A] bg-white border border-[#DCE6F0] hover:bg-slate-100 transition-colors"
                onClick={() => { setReviewOpen(false); setError(''); }}
                disabled={submitting}
              >
                Back & Edit
              </button>
              <button 
                type="button"
                className="btn btn-primary px-7 py-2.5 rounded-[12px] text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-blue-500/20 flex items-center gap-2"
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm Booking</span>
                  </>
                )}
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

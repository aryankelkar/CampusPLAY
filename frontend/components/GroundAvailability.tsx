import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  CalendarCheck
} from 'lucide-react';
import api from '../lib/api';
import { GAMES } from '../constants';
import { CAMPUS_FACILITIES, getCompatibleFacilities, getFacilityLabelForSport } from '../utils/facilityConfig';
import { useSocket } from '../context/SocketContext';

export default function GroundAvailability() {
  const router = useRouter();
  const { socket } = useSocket();
  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [sport, setSport] = useState('Football');
  const [ground, setGround] = useState('Ground 1');
  const [date, setDate] = useState(minDate);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<{ slot: string; status: 'Booked' | 'Reserved' | 'Vacant'; bookedBy?: string | null; game?: string | null }[]>([]);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    setError('');
    setSelectedSlot(null);

    if (!ground || !date) {
      setError('Please select both a campus ground and a date.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get('/bookings/availability', { params: { ground, date } });
      setAvailability(data?.data?.slots || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Unable to load availability right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [ground, date]);

  // Auto-fetch initial availability on mount or filter change
  useEffect(() => {
    if (ground && date) {
      fetchAvailability();
    }
  }, [fetchAvailability, ground, date]);

  const compatibleFacilities = useMemo(() => {
    return getCompatibleFacilities(sport);
  }, [sport]);

  const handleSportChange = (newSport: string) => {
    setSport(newSport);
    const compatible = getCompatibleFacilities(newSport);
    if (!compatible.some(f => f.name === ground)) {
      setGround(compatible[0]?.name || '');
    }
    setSelectedSlot(null);
  };

  // Real-time socket updates for availability
  useEffect(() => {
    if (!socket || !date || !ground) return;
    const handleBookingUpdate = (data: any) => {
      const booking = data?.booking;
      if (!booking || (booking.ground === ground && booking.date === date)) {
        api.get('/bookings/availability', { params: { ground, date } })
          .then(({ data }) => { setAvailability(data?.data?.slots || []); })
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

  const isToday = useMemo(() => {
    if (!date) return false;
    return date === minDate;
  }, [date, minDate]);

  const formatDateHeader = (isoDate: string) => {
    try {
      if (!isoDate) return '';
      const d = new Date(isoDate + 'T00:00:00');
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoDate;
    }
  };

  // Metrics derived strictly from real API response
  const availableCount = useMemo(() => availability.filter(s => s.status === 'Vacant').length, [availability]);
  const reservedCount = useMemo(() => availability.filter(s => s.status === 'Reserved').length, [availability]);
  const bookedCount = useMemo(() => availability.filter(s => s.status === 'Booked').length, [availability]);
  const totalCount = availability.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-inter">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-[11px] font-extrabold uppercase tracking-[0.08em] mb-1.5 border border-[#BFDBFE]">
          Ground Availability
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-1">
          Find an Open Slot
        </h1>
        <p className="text-xs sm:text-sm text-[#52657A] font-normal leading-relaxed">
          Check the current availability of campus grounds before making a reservation.
        </p>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-[22px] border border-[#E8EEF5] p-5 sm:p-7 shadow-[6px_6px_18px_rgba(148,163,184,0.14),-6px_-6px_18px_rgba(255,255,255,0.9)]">
        
        {/* Error Alert */}
        {error && (
          <div className="mb-5 rounded-[14px] border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <XCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Compact Horizontal Control Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mb-6 p-4 rounded-[18px] bg-[#F8FAFC] border border-[#E2E8F0]">
          
          {/* Sport Selector */}
          <div className="col-span-1 lg:col-span-3">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block flex items-center gap-1">
              <Sparkles size={13} className="text-[#2563EB]" />
              <span>Sport</span>
            </label>
            <select 
              value={sport} 
              onChange={(e) => handleSportChange(e.target.value)} 
              className="select text-xs font-semibold py-2.5 px-3 h-[46px] rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs w-full"
            >
              {GAMES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Facility Selector */}
          <div className="col-span-1 lg:col-span-3">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block flex items-center gap-1">
              <MapPin size={13} className="text-[#2563EB]" />
              <span>{getFacilityLabelForSport(sport)}</span>
            </label>
            <select 
              value={ground} 
              onChange={(e) => { setGround(e.target.value); setSelectedSlot(null); }} 
              className="select text-xs font-semibold py-2.5 px-3 h-[46px] rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs w-full"
            >
              {compatibleFacilities.map((fac) => (
                <option key={fac.name} value={fac.name}>{fac.name}</option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div className="col-span-1 lg:col-span-3">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1 block flex items-center gap-1">
              <Calendar size={13} className="text-[#2563EB]" />
              <span>Date</span>
            </label>
            <input 
              type="date" 
              min={minDate}
              value={date} 
              onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }} 
              className="input text-xs font-semibold py-2.5 px-3 h-[46px] rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs w-full" 
            />
          </div>

          {/* Check Availability Button */}
          <div className="col-span-1 lg:col-span-3 flex items-end">
            <button 
              onClick={fetchAvailability} 
              disabled={loading || !ground || !date} 
              className="btn btn-primary font-extrabold text-xs uppercase tracking-wider px-4 h-[46px] w-full rounded-[12px] flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all text-white whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white shrink-0" />
                  <span className="whitespace-nowrap">Checking...</span>
                </>
              ) : (
                <>
                  <Search size={15} className="text-white shrink-0" />
                  <span className="whitespace-nowrap tracking-wider">Check Availability</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Area */}
        {availability.length > 0 && !loading && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Results Header & Legend */}
            <div className="p-4 rounded-[16px] bg-[#EFF6FF] border border-[#BFDBFE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#2563EB] mb-0.5">
                  {isToday ? "TODAY'S AVAILABILITY" : `AVAILABILITY FOR ${formatDateHeader(date).toUpperCase()}`}
                </div>
                <div className="text-sm font-extrabold text-[#0F172A]">
                  {ground} • <span className="text-[#2563EB]">{formatDateHeader(date)}</span>
                </div>
              </div>

              {/* Legend & Real Counts */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-[#10B981]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Available ({availableCount})
                </span>
                <span className="flex items-center gap-1.5 text-[#D97706]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span> Reserved ({reservedCount})
                </span>
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></span> Booked ({bookedCount})
                </span>
                {selectedSlot && (
                  <span className="flex items-center gap-1.5 text-[#2563EB]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span> Selected (1)
                  </span>
                )}
              </div>
            </div>

            {/* Time Slot Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {availability.map((slot, index) => {
                const isReserved = slot.status === 'Reserved';
                const isBooked = slot.status === 'Booked';
                const isOccupied = isBooked || isReserved;
                const isSelected = selectedSlot === slot.slot;
                
                return (
                  <button 
                    key={index} 
                    type="button"
                    disabled={isOccupied}
                    title={isOccupied ? "Reserved by another booking" : ""}
                    onClick={() => {
                      if (!isOccupied) {
                        setSelectedSlot(isSelected ? null : slot.slot);
                      }
                    }}
                    className={`p-3.5 rounded-[16px] border text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#2563EB] border-[#1D4ED8] text-white shadow-md font-bold ring-2 ring-[#2563EB]/30'
                        : isReserved
                          ? 'bg-[#FEF3C7] border-[#FCD34D] text-[#92400E] cursor-not-allowed opacity-85'
                          : isBooked 
                            ? 'bg-[#F1F5F9] border-[#CBD5E1] text-[#94A3B8] opacity-60 cursor-not-allowed' 
                            : 'bg-white border-[#E8EEF5] text-[#0F172A] hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:-translate-y-0.5 shadow-xs cursor-pointer'
                    }`}
                  >
                    <div className="font-bold text-xs mb-1.5 flex items-center gap-1.5">
                      <Clock size={14} className={isSelected ? 'text-white' : isReserved ? 'text-[#D97706]' : isBooked ? 'text-[#94A3B8]' : 'text-[#2563EB]'} />
                      <span className={isSelected ? 'text-white font-extrabold' : isReserved ? 'text-[#92400E] font-bold' : 'text-[#0F172A]'}>{slot.slot}</span>
                    </div>
                    
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-[6px] uppercase tracking-wider inline-block ${
                      isSelected 
                        ? 'bg-white/20 text-white border border-white/30' 
                        : isReserved
                          ? 'bg-[#FDE68A] text-[#92400E]'
                          : isBooked 
                            ? 'bg-[#E2E8F0] text-[#64748B]' 
                            : 'bg-[#DBEAFE] text-[#2563EB]'
                    }`}>
                      {isSelected ? '✓ SELECTED' : isReserved ? 'RESERVED' : isBooked ? 'BOOKED' : 'AVAILABLE'}
                    </span>

                    {isOccupied && (
                      <div className="text-[10px] text-[#64748B] mt-2 pt-1.5 border-t border-[#E2E8F0] font-medium truncate">
                        <span>{isReserved ? 'Reserved by another booking' : 'Booked'}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-[16px] bg-[#EFF6FF] border border-[#BFDBFE]/50" />
            ))}
          </div>
        )}

        {/* Empty State Before Search */}
        {availability.length === 0 && !loading && (
          <div className="p-8 sm:p-10 text-center bg-white rounded-[20px] border border-[#E8EEF5] shadow-xs max-w-md mx-auto my-4">
            <div className="w-12 h-12 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
              <CalendarCheck size={24} />
            </div>
            <h3 className="font-extrabold text-base text-[#0F172A] mb-1">SELECT A GROUND AND DATE</h3>
            <p className="text-xs text-[#52657A]">Choose a ground and date above to view available time slots.</p>
          </div>
        )}

        {/* Selected Slot Summary Bar */}
        {selectedSlot && (
          <div className="mt-6 pt-5 border-t border-[#E8EEF5] bg-[#EFF6FF] border border-[#BFDBFE] p-4 sm:p-5 rounded-[18px] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#2563EB] text-white flex items-center justify-center font-bold flex-shrink-0">
                <Check size={20} strokeWidth={3} />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase text-[#2563EB]">Slot Selected</div>
                <div className="text-sm font-extrabold text-[#0F172A]">
                  {ground} • {formatDateHeader(date)} • <span className="text-[#2563EB]">{selectedSlot}</span>
                </div>
              </div>
            </div>

            <Link 
              href="/bookings" 
              className="btn btn-primary px-5 py-3 rounded-[12px] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 text-white shadow-md hover:-translate-y-0.5 transition-all flex-shrink-0"
            >
              <span>BOOK THIS SLOT</span>
              <ArrowRight size={16} className="text-white" />
            </Link>
          </div>
        )}

      </div>

    </div>
  );
}

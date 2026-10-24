import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../lib/api';
import BookingCard from '../components/BookingCard';
import { ListSkeleton } from '../components/common/LoadingSkeleton';
import { BOOKING_STATUS } from '../constants';
import { getTodayDate, getMonthYearLabel } from '../utils/helpers';
import { useSocket } from '../context/SocketContext';
import { Search, X, CalendarCheck, Sparkles, Filter, AlertCircle, Dumbbell, PackageCheck, Clock, Calendar, RotateCcw, ShieldCheck, CheckCircle2, ArrowUpDown } from 'lucide-react';
import StudentEquipmentReturnModal from '../components/StudentEquipmentReturnModal';
import { sortBookings, SortDateOption } from '../utils/dateSorting';

export default function HistoryPage() {
  return (
    <ProtectedRoute role="student">
      <BookingHistory />
    </ProtectedRoute>
  );
}

function BookingHistory() {
  const { socket } = useSocket();
  const [groundBookings, setGroundBookings] = useState<any[]>([]);
  const [equipmentBookings, setEquipmentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeScope, setTimeScope] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [filter, setFilter] = useState<'all' | 'ground' | 'equipment' | 'pending' | 'approved' | 'issued' | 'returned' | 'rejected' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortDateOption>('event-desc');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [returnModalBooking, setReturnModalBooking] = useState<any | null>(null);
  const isFetchingRef = useRef(false);

  const fetchAllHistory = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      if (isInitial) setLoading(true);
      const [{ data: gData }, { data: eqData }] = await Promise.all([
        api.get('/bookings').catch(() => ({ data: { data: { bookings: [] } } })),
        api.get('/equipment-bookings').catch(() => ({ data: { data: { bookings: [] } } })),
      ]);

      const gList = (gData?.data?.bookings || []).map((b: any) => ({ ...b, itemType: 'ground' }));
      const eqList = (eqData?.data?.bookings || []).map((b: any) => ({ ...b, itemType: 'equipment' }));

      setGroundBookings(gList);
      setEquipmentBookings(eqList);
    } finally {
      isFetchingRef.current = false;
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchAllHistory(true); 
    const interval = setInterval(() => { fetchAllHistory(false); }, 60000);
    return () => clearInterval(interval);
  }, [fetchAllHistory]);

  // Real-time Socket.io updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchAllHistory(false);
    };

    socket.on('booking:cancelled', handleUpdate);
    socket.on('booking:approved', handleUpdate);
    socket.on('booking:rejected', handleUpdate);
    socket.on('booking:created', handleUpdate);
    socket.on('booking:deleted', handleUpdate);
    socket.on('equipment-booking:created', handleUpdate);
    socket.on('equipment-booking:approved', handleUpdate);
    socket.on('equipment-booking:ready', handleUpdate);
    socket.on('equipment-booking:issued', handleUpdate);
    socket.on('equipment-booking:return-requested', handleUpdate);
    socket.on('equipment-booking:returned', handleUpdate);
    socket.on('equipment-booking:return-issue', handleUpdate);
    socket.on('equipment-booking:rejected', handleUpdate);
    socket.on('equipment-booking:cancelled', handleUpdate);
    socket.on('equipment-booking:deleted', handleUpdate);

    return () => {
      socket.off('booking:cancelled', handleUpdate);
      socket.off('booking:approved', handleUpdate);
      socket.off('booking:rejected', handleUpdate);
      socket.off('booking:created', handleUpdate);
      socket.off('booking:deleted', handleUpdate);
      socket.off('equipment-booking:created', handleUpdate);
      socket.off('equipment-booking:approved', handleUpdate);
      socket.off('equipment-booking:ready', handleUpdate);
      socket.off('equipment-booking:issued', handleUpdate);
      socket.off('equipment-booking:return-requested', handleUpdate);
      socket.off('equipment-booking:returned', handleUpdate);
      socket.off('equipment-booking:return-issue', handleUpdate);
      socket.off('equipment-booking:rejected', handleUpdate);
      socket.off('equipment-booking:cancelled', handleUpdate);
      socket.off('equipment-booking:deleted', handleUpdate);
    };
  }, [socket, fetchAllHistory]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCancelGroundBooking = async (bookingId: string) => {
    try {
      setCancelling(bookingId);
      await api.patch(`/bookings/${bookingId}/cancel`);
      
      setGroundBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: BOOKING_STATUS.CANCELLED } : b
        )
      );
      setToast({ message: 'Ground reservation cancelled.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Unable to cancel booking.', type: 'error' });
    } finally {
      setCancelling(null);
    }
  };

  const handleCancelEquipmentBooking = async (bookingId: string) => {
    try {
      setCancelling(bookingId);
      await api.put(`/equipment-bookings/${bookingId}/cancel`);

      setEquipmentBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: 'Cancelled' } : b
        )
      );
      setToast({ message: 'Equipment reservation cancelled.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Unable to cancel equipment reservation.', type: 'error' });
    } finally {
      setCancelling(null);
    }
  };

  const handleDeleteGroundBooking = async (bookingId: string) => {
    try {
      setDeleting(bookingId);
      await api.delete(`/bookings/${bookingId}`);
      setGroundBookings((prev) => prev.filter((b) => b._id !== bookingId));
      setToast({ message: 'Booking record deleted.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Unable to delete record.', type: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteEquipmentBooking = async (bookingId: string) => {
    try {
      setDeleting(bookingId);
      await api.delete(`/equipment-bookings/${bookingId}`);
      setEquipmentBookings((prev) => prev.filter((b) => b._id !== bookingId));
      setToast({ message: 'Equipment booking record deleted.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Unable to delete record.', type: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  const combinedBookings = useMemo(() => {
    return [...groundBookings, ...equipmentBookings];
  }, [groundBookings, equipmentBookings]);

  const todayStr = useMemo(() => getTodayDate(), []);

  const upcomingBookings = useMemo(() => {
    return combinedBookings.filter((b) => {
      // Actively held equipment belongs to active scope
      if (b.itemType === 'equipment' && (b.status === 'Issued' || b.status === 'Return Requested')) {
        return true;
      }
      return !b.date || b.date >= todayStr;
    });
  }, [combinedBookings, todayStr]);

  const pastBookings = useMemo(() => {
    return combinedBookings.filter((b) => {
      if (b.itemType === 'equipment' && (b.status === 'Issued' || b.status === 'Return Requested')) {
        return false;
      }
      return b.date && b.date < todayStr;
    });
  }, [combinedBookings, todayStr]);

  const currentScopeList = useMemo(() => {
    if (timeScope === 'upcoming') return upcomingBookings;
    if (timeScope === 'past') return pastBookings;
    return combinedBookings;
  }, [timeScope, upcomingBookings, pastBookings, combinedBookings]);

  const filteredBookings = useMemo(() => {
    let list = currentScopeList;
    if (filter === 'ground') list = list.filter(b => b.itemType === 'ground');
    else if (filter === 'equipment') list = list.filter(b => b.itemType === 'equipment');
    else if (filter === 'pending') list = list.filter(b => b.status === 'Pending');
    else if (filter === 'approved') list = list.filter(b => b.status === 'Approved' || b.status === 'Ready for Collection');
    else if (filter === 'issued') list = list.filter(b => b.status === 'Issued' || b.status === 'Return Requested');
    else if (filter === 'returned') list = list.filter(b => b.status === 'Returned' || b.status === 'Return Issue');
    else if (filter === 'rejected') list = list.filter(b => b.status === 'Rejected');
    else if (filter === 'cancelled') list = list.filter(b => b.status === 'Cancelled');
    return list;
  }, [currentScopeList, filter]);

  const searchedBookings = useMemo(() => {
    let list = filteredBookings;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = filteredBookings.filter((b) => {
        if (b.itemType === 'ground') {
          return (
            b.game?.toLowerCase().includes(q) ||
            b.ground?.toLowerCase().includes(q) ||
            b.date?.toLowerCase().includes(q) ||
            b.time?.toLowerCase().includes(q)
          );
        } else {
          return (
            b.equipmentName?.toLowerCase().includes(q) ||
            b.equipmentCategory?.toLowerCase().includes(q) ||
            b.date?.toLowerCase().includes(q)
          );
        }
      });
    }
    return sortBookings(list, sortBy);
  }, [filteredBookings, searchQuery, sortBy]);

  return (
    <div className="w-full text-[#0F172A] font-inter py-2">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-[12px] shadow-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success' ? 'bg-[#2563EB] text-white' : 'bg-rose-600 text-white'
          }`}>
            <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-[11px] font-extrabold uppercase tracking-[0.08em] mb-1.5 border border-[#BFDBFE]">
            Student History
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-1">
            Reservations & Equipment History
          </h1>
          <p className="text-xs sm:text-sm text-[#52657A] font-normal leading-relaxed">
            View and manage your sports ground bookings and equipment requests.
          </p>
        </div>

        {/* Time Scope Tabs: Active & Upcoming vs Past Bookings vs All */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 p-2 bg-[#F8FAFC] rounded-[18px] border border-[#E2E8F0]">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setTimeScope('upcoming'); setFilter('all'); }}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-[12px] text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                timeScope === 'upcoming'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#52657A] hover:text-[#0F172A] hover:bg-white bg-transparent'
              }`}
            >
              <Clock size={14} />
              <span>Active & Upcoming</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                timeScope === 'upcoming' ? 'bg-white/25 text-white' : 'bg-[#E2E8F0] text-[#0F172A]'
              }`}>
                {upcomingBookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setTimeScope('past'); setFilter('all'); }}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-[12px] text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                timeScope === 'past'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#52657A] hover:text-[#0F172A] hover:bg-white bg-transparent'
              }`}
            >
              <CalendarCheck size={14} />
              <span>Past Bookings</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                timeScope === 'past' ? 'bg-white/25 text-white' : 'bg-[#E2E8F0] text-[#0F172A]'
              }`}>
                {pastBookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setTimeScope('all'); setFilter('all'); }}
              className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-[12px] text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                timeScope === 'all'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#52657A] hover:text-[#0F172A] hover:bg-white bg-transparent'
              }`}
            >
              <span>All History</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                timeScope === 'all' ? 'bg-white/25 text-white' : 'bg-[#E2E8F0] text-[#0F172A]'
              }`}>
                {combinedBookings.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] font-semibold text-[#64748B] px-3 py-1 flex items-center gap-2 self-center sm:self-auto">
            {timeScope === 'upcoming' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Slots ({upcomingBookings.length})</span>
              </>
            ) : timeScope === 'past' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Past Records ({pastBookings.length})</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span>All Records ({combinedBookings.length})</span>
              </>
            )}
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="bg-white border border-[#DCE6F0] rounded-[20px] p-4 shadow-xs mb-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              {[
                { id: 'all', label: 'All' },
                { id: 'ground', label: 'Ground Bookings' },
                { id: 'equipment', label: 'Equipment' },
                { id: 'pending', label: 'Pending' },
                { id: 'approved', label: 'Approved' },
                { id: 'issued', label: 'Issued / In Use' },
                { id: 'returned', label: 'Returned' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filter === t.id
                      ? 'bg-[#2563EB] text-white font-extrabold shadow-xs'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="relative w-full sm:w-auto min-w-[195px]">
                <select
                  aria-label="Sort history by date"
                  className="select text-xs font-semibold py-1.5 !pl-8.5 pr-7 h-[36px] w-full rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortDateOption)}
                >
                  <option value="event-desc">Event Date: Latest First</option>
                  <option value="event-asc">Event Date: Earliest First</option>
                  <option value="created-desc">Request Date: Newest First</option>
                  <option value="created-asc">Request Date: Oldest First</option>
                </select>
                <ArrowUpDown size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#2563EB] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Reservation Cards List */}
        {loading ? (
          <ListSkeleton />
        ) : searchedBookings.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#DCE6F0] rounded-[20px] max-w-md mx-auto">
            <CalendarCheck size={40} className="mx-auto mb-3 text-[#94A3B8]" />
            <h3 className="text-base font-extrabold text-[#0F172A] mb-1">
              {timeScope === 'upcoming' 
                ? 'No Upcoming Reservations' 
                : timeScope === 'past' 
                  ? 'No Past Reservations' 
                  : 'No Reservations Found'}
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              {timeScope === 'upcoming'
                ? "You have no upcoming or active reservations. Concluded or past bookings are stored in the Past Bookings tab."
                : "You have no reservations matching your current filter criteria."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {timeScope === 'upcoming' && pastBookings.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setTimeScope('past'); setFilter('all'); }}
                  className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1D4ED8] transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CalendarCheck size={13} />
                  <span>View Past Bookings ({pastBookings.length})</span>
                </button>
              )}
              <Link href="/bookings" className="px-4 py-2 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-xl hover:bg-[#DBEAFE] transition-all">
                Book a Ground
              </Link>
              <Link href="/equipment" className="px-4 py-2 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-xl hover:bg-[#DBEAFE] transition-all">
                Reserve Equipment
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {searchedBookings.map((item) => {
              if (item.itemType === 'ground') {
                return (
                  <BookingCard
                    key={item._id}
                    booking={item}
                    onCancel={() => handleCancelGroundBooking(item._id)}
                    onDelete={() => handleDeleteGroundBooking(item._id)}
                  />
                );
              }

              // Equipment Booking Card
              const isPending = item.status === 'Pending';
              const isApproved = item.status === 'Approved';
              const isReady = item.status === 'Ready for Collection';
              const isIssued = item.status === 'Issued';
              const isReturnRequested = item.status === 'Return Requested';
              const isReturned = item.status === 'Returned';
              const isReturnIssue = item.status === 'Return Issue';
              const isRejected = item.status === 'Rejected';
              const isCancelled = item.status === 'Cancelled';
              const isOverdue = item.status === 'Overdue';
              const isEligibleForReturn = isIssued || isApproved || isReady || isOverdue;

              const getEquipmentStatusBadge = () => {
                if (isPending) return { label: 'Pending Approval', bg: 'bg-[#FEF3C7] text-[#92400E] border-amber-200' };
                if (isApproved) return { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
                if (isReady) return { label: 'Ready for Collection', bg: 'bg-sky-100 text-sky-800 border-sky-200' };
                if (isIssued) return { label: 'Issued — In Use', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200 font-extrabold' };
                if (isReturnRequested) return { label: 'Return Confirmation Pending', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold' };
                if (isReturned) return { label: 'Returned', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' };
                if (isReturnIssue) return { label: 'Return Issue', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
                if (isOverdue) return { label: 'Overdue', bg: 'bg-red-100 text-red-800 border-red-300' };
                if (isRejected) return { label: 'Rejected', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
                return { label: item.status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
              };

              const badge = getEquipmentStatusBadge();

              return (
                <div 
                  key={item._id}
                  className="p-5 rounded-[20px] bg-white border border-[#DCE6F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#BFDBFE]"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-extrabold border border-[#BFDBFE] shrink-0">
                      <Dumbbell size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] uppercase tracking-wider">
                          {item.equipmentCategory || item.equipment?.category || 'Equipment'}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-[#0F172A]">
                        {item.equipmentName || item.equipment?.name || 'Sports Equipment'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#52657A] font-medium">
                        <span className="flex items-center gap-1 font-bold text-[#2563EB]">
                          Quantity: {item.quantityIssued || item.quantity} units
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-[#94A3B8]" /> Request Date: {item.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-[#94A3B8]" /> Slot: {item.collectionTime} → {item.returnTime}
                        </span>
                        {item.issuedAt && (
                          <span className="flex items-center gap-1 text-[#0F172A] font-semibold">
                            Issued: {new Date(item.issuedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {/* Return Status Details */}
                      {isReturnRequested && (
                        <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                          <Clock size={13} className="text-amber-600 shrink-0" />
                          <span>
                            Return reported{item.returnRequestedAt ? ` on ${new Date(item.returnRequestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}. Awaiting administrator physical inspection.
                          </span>
                        </div>
                      )}

                      {isReturned && (
                        <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>
                            Physical return confirmed{item.returnConfirmedAt ? ` on ${new Date(item.returnConfirmedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}. Usable items restored to inventory: {item.quantityReturned ?? item.quantity} units.
                          </span>
                        </div>
                      )}

                      {isReturnIssue && (
                        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertCircle size={13} className="text-rose-600 shrink-0" />
                            <span>Return Issue Flagged — Please visit the Equipment Desk</span>
                          </div>
                          <p className="text-[#52657A]">
                            Reported condition: <strong className="text-rose-900 font-semibold">{item.returnCondition || 'Damaged / Missing'}</strong>
                            {item.quantityDamaged > 0 && ` • Damaged: ${item.quantityDamaged}`}
                            {item.quantityMissing > 0 && ` • Missing: ${item.quantityMissing}`}
                            {item.returnNotes && ` • Notes: "${item.returnNotes}"`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {/* Eligible for return */}
                    {isEligibleForReturn && (
                      <button
                        type="button"
                        onClick={() => setReturnModalBooking(item)}
                        className="btn bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>Return Equipment</span>
                      </button>
                    )}

                    {/* Return requested: confirmation pending */}
                    {isReturnRequested && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                        <Clock size={13} className="text-amber-600 animate-spin" />
                        <span>Return Confirmation Pending</span>
                      </span>
                    )}

                    {/* Cancellable before physical issuance */}
                    {(isPending || isApproved || isReady) && (
                      <button
                        type="button"
                        disabled={cancelling === item._id}
                        onClick={() => handleCancelEquipmentBooking(item._id)}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {cancelling === item._id ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    )}

                    {/* Deletable if concluded */}
                    {(isRejected || isCancelled || isReturned) && (
                      <button
                        type="button"
                        disabled={deleting === item._id}
                        onClick={() => handleDeleteEquipmentBooking(item._id)}
                        className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9] text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {deleting === item._id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Student Equipment Return Modal */}
        <StudentEquipmentReturnModal
          isOpen={!!returnModalBooking}
          onClose={() => setReturnModalBooking(null)}
          booking={returnModalBooking}
          onSuccess={(updated) => {
            setEquipmentBookings((prev) =>
              prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b))
            );
            setToast({
              message: 'Equipment return reported. Desk staff confirmation is pending.',
              type: 'success',
            });
            fetchAllHistory();
          }}
        />

      </div>
    </div>
  );
}

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../lib/api';
import BookingCard from '../components/BookingCard';
import { ListSkeleton } from '../components/common/LoadingSkeleton';
import { BOOKING_STATUS } from '../constants';
import { getTodayDate, getMonthYearLabel } from '../utils/helpers';
import { useSocket } from '../context/SocketContext';
import { Search, X, CalendarCheck, Sparkles, Filter, AlertCircle, Dumbbell, PackageCheck, Clock, Calendar, RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import StudentEquipmentReturnModal from '../components/StudentEquipmentReturnModal';

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
  const [filter, setFilter] = useState<'all' | 'ground' | 'equipment' | 'pending' | 'approved' | 'issued' | 'returned' | 'rejected' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
    return [...groundBookings, ...equipmentBookings].sort((a, b) => {
      return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
    });
  }, [groundBookings, equipmentBookings]);

  const filteredBookings = useMemo(() => {
    if (filter === 'ground') return combinedBookings.filter(b => b.itemType === 'ground');
    if (filter === 'equipment') return combinedBookings.filter(b => b.itemType === 'equipment');
    if (filter === 'pending') return combinedBookings.filter(b => b.status === 'Pending');
    if (filter === 'approved') return combinedBookings.filter(b => b.status === 'Approved' || b.status === 'Ready for Collection');
    if (filter === 'issued') return combinedBookings.filter(b => b.status === 'Issued' || b.status === 'Return Requested');
    if (filter === 'returned') return combinedBookings.filter(b => b.status === 'Returned' || b.status === 'Return Issue');
    if (filter === 'rejected') return combinedBookings.filter(b => b.status === 'Rejected');
    if (filter === 'cancelled') return combinedBookings.filter(b => b.status === 'Cancelled');
    return combinedBookings;
  }, [combinedBookings, filter]);

  const searchedBookings = useMemo(() => {
    if (!searchQuery.trim()) return filteredBookings;
    const q = searchQuery.toLowerCase();
    return filteredBookings.filter((b) => {
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
  }, [filteredBookings, searchQuery]);

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

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* Reservation Cards List */}
        {loading ? (
          <ListSkeleton />
        ) : searchedBookings.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#DCE6F0] rounded-[20px] max-w-md mx-auto">
            <CalendarCheck size={40} className="mx-auto mb-3 text-[#94A3B8]" />
            <h3 className="text-base font-extrabold text-[#0F172A] mb-1">No reservations found</h3>
            <p className="text-xs text-[#64748B] mb-4">You have no active or historical bookings matching your filter.</p>
            <div className="flex gap-2 justify-center">
              <Link href="/bookings" className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-xs">
                Book a Ground
              </Link>
              <Link href="/equipment" className="px-4 py-2 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-xl">
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

import { useEffect, useState, useMemo } from 'react';
import api from '../lib/api';
import { 
  CheckCircle2, 
  XCircle, 
  Dumbbell, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  Loader2, 
  Search,
  Trash2,
  Package,
  RotateCcw,
  AlertTriangle,
  Phone,
  Mail,
  GraduationCap,
  ShieldCheck,
  Check,
  ArrowUpDown,
  History
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import AdminEquipmentReturnModal from './AdminEquipmentReturnModal';
import { sortBookings, SortDateOption } from '../utils/dateSorting';
import { getTodayDate } from '../utils/helpers';

type FilterType = 'all' | 'Pending' | 'Approved' | 'Issued' | 'Return Requested' | 'Returned' | 'Return Issue' | 'Cancelled';

export default function AdminEquipmentList() {
  const { socket } = useSocket();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [timeScope, setTimeScope] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortDateOption>('event-desc');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [returnModalBooking, setReturnModalBooking] = useState<any | null>(null);

  const todayStr = useMemo(() => getTodayDate(), []);

  const currentScopeRequests = useMemo(() => {
    if (timeScope === 'upcoming') return requests.filter((r) => !r.date || r.date >= todayStr);
    if (timeScope === 'past') return requests.filter((r) => r.date && r.date < todayStr);
    return requests;
  }, [requests, timeScope, todayStr]);

  const fetchEquipmentBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/equipment-bookings');
      setRequests(data?.data?.bookings || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipmentBookings();
  }, []);

  // Socket updates
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchEquipmentBookings();

    socket.on('equipment-booking:created', refresh);
    socket.on('equipment-booking:approved', refresh);
    socket.on('equipment-booking:ready', refresh);
    socket.on('equipment-booking:issued', refresh);
    socket.on('equipment-booking:return-requested', refresh);
    socket.on('equipment-booking:returned', refresh);
    socket.on('equipment-booking:return-issue', refresh);
    socket.on('equipment-booking:rejected', refresh);
    socket.on('equipment-booking:cancelled', refresh);
    socket.on('equipment-booking:deleted', refresh);

    return () => {
      socket.off('equipment-booking:created', refresh);
      socket.off('equipment-booking:approved', refresh);
      socket.off('equipment-booking:ready', refresh);
      socket.off('equipment-booking:issued', refresh);
      socket.off('equipment-booking:return-requested', refresh);
      socket.off('equipment-booking:returned', refresh);
      socket.off('equipment-booking:return-issue', refresh);
      socket.off('equipment-booking:rejected', refresh);
      socket.off('equipment-booking:cancelled', refresh);
      socket.off('equipment-booking:deleted', refresh);
    };
  }, [socket]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await api.put(`/equipment-bookings/${id}/approve`);
      setToast({ message: 'Equipment booking approved successfully!', type: 'success' });
      fetchEquipmentBookings();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Approval conflict: insufficient equipment is available for this reservation.';
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleIssue = async (id: string) => {
    try {
      setActionLoading(id);
      await api.put(`/equipment-bookings/${id}/issue`);
      setToast({ message: 'Equipment physically issued to student.', type: 'success' });
      fetchEquipmentBookings();
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Failed to issue equipment.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      await api.put(`/equipment-bookings/${id}/reject`, { reason: 'Rejected by admin' });
      setToast({ message: 'Equipment request rejected.', type: 'success' });
      fetchEquipmentBookings();
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Failed to reject equipment request.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id);
      await api.delete(`/equipment-bookings/${id}`);
      setToast({ message: 'Equipment request record deleted.', type: 'success' });
      fetchEquipmentBookings();
    } catch (err: any) {
      setToast({ message: 'Failed to delete record.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = useMemo(() => {
    const list = currentScopeRequests.filter((r) => {
      let matchFilter = true;
      if (filter !== 'all') {
        if (filter === 'Approved') {
          matchFilter = r.status === 'Approved' || r.status === 'Ready for Collection';
        } else {
          matchFilter = r.status === filter;
        }
      }

      const q = search.toLowerCase();
      const matchSearch = 
        (r.equipmentName || r.equipment?.name || '').toLowerCase().includes(q) ||
        (r.studentName || r.student?.name || '').toLowerCase().includes(q) ||
        (r.studentRoll || r.student?.roll || '').toLowerCase().includes(q) ||
        (r.studentEmail || r.student?.email || '').toLowerCase().includes(q) ||
        (r.phone || r.student?.phone || '').includes(q) ||
        (r.date || '').includes(q);

      return matchFilter && matchSearch;
    });

    return sortBookings(list, sortBy);
  }, [currentScopeRequests, filter, search, sortBy]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return { label: 'Pending Approval', bg: 'bg-[#FEF3C7] text-[#92400E] border-amber-300' };
      case 'Approved':
        return { label: 'Approved — Reserved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'Ready for Collection':
        return { label: 'Ready for Collection', bg: 'bg-sky-100 text-sky-800 border-sky-300' };
      case 'Issued':
        return { label: 'Issued — Currently with Student', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-extrabold' };
      case 'Return Requested':
        return { label: 'Return Confirmation Pending', bg: 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold' };
      case 'Returned':
        return { label: 'Returned & Stock Restored', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'Return Issue':
        return { label: 'Return Issue Flagged', bg: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold' };
      case 'Overdue':
        return { label: 'Overdue', bg: 'bg-red-100 text-red-800 border-red-300' };
      case 'Rejected':
        return { label: 'Rejected', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  return (
    <div className="space-y-5 font-inter text-xs">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl border font-bold text-xs flex items-center justify-between shadow-md transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-xs hover:opacity-75">✕</button>
        </div>
      )}

      {/* Time Scope Tabs: Upcoming vs Past Requests vs All */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-[#DCE6F0] shadow-xs">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTimeScope('upcoming')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              timeScope === 'upcoming'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
            }`}
          >
            <Clock size={13} />
            <span>Upcoming & Today</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              timeScope === 'upcoming' ? 'bg-white/20 text-white' : 'bg-[#EFF6FF] text-[#2563EB] font-bold'
            }`}>
              {requests.filter((r) => !r.date || r.date >= todayStr).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTimeScope('past')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              timeScope === 'past'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
            }`}
          >
            <History size={13} />
            <span>Past Requests</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              timeScope === 'past' ? 'bg-white/20 text-white' : 'bg-[#EFF6FF] text-[#2563EB] font-bold'
            }`}>
              {requests.filter((r) => r.date && r.date < todayStr).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTimeScope('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              timeScope === 'all'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
            }`}
          >
            <span>All Records</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              timeScope === 'all' ? 'bg-white/20 text-white' : 'bg-[#EFF6FF] text-[#2563EB] font-bold'
            }`}>
              {requests.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] font-semibold text-[#64748B] px-2 flex items-center gap-1.5 self-center sm:self-auto">
          {timeScope === 'upcoming' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active requests ({requests.filter((r) => !r.date || r.date >= todayStr).length})</span>
            </>
          ) : timeScope === 'past' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Historical records ({requests.filter((r) => r.date && r.date < todayStr).length})</span>
            </>
          ) : (
            <span>All records ({requests.length})</span>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {(['all', 'Pending', 'Approved', 'Issued', 'Return Requested', 'Returned', 'Return Issue', 'Cancelled'] as FilterType[]).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === st
                  ? 'bg-[#2563EB] text-white font-extrabold shadow-xs'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
              }`}
            >
              {st === 'all' ? 'All Requests' : st}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="relative w-full sm:w-auto min-w-[195px]">
            <select
              aria-label="Sort equipment requests by date"
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

      {/* Requests List */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-[#DCE6F0] rounded-2xl">
          <Loader2 size={32} className="mx-auto text-[#2563EB] animate-spin mb-2" />
          <p className="text-xs text-[#64748B] font-semibold">Loading equipment requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#DCE6F0] rounded-2xl max-w-md mx-auto">
          <Package size={40} className="mx-auto mb-3 text-[#94A3B8]" />
          <h3 className="text-base font-extrabold text-[#0F172A] mb-1">No equipment requests</h3>
          <p className="text-xs text-[#64748B]">There are currently no equipment reservations matching this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'Pending';
            const isApproved = req.status === 'Approved' || req.status === 'Ready for Collection';
            const isIssued = req.status === 'Issued';
            const isReturnRequested = req.status === 'Return Requested';
            const isReturned = req.status === 'Returned';
            const isReturnIssue = req.status === 'Return Issue';
            const isRejected = req.status === 'Rejected';
            const isCancelled = req.status === 'Cancelled';

            const badge = getStatusBadge(req.status);
            const issuedQty = req.quantityIssued || req.quantity;

            const studentName = req.studentName || req.student?.name || 'Student';
            const studentEmail = req.studentEmail || req.student?.email || 'N/A';
            const studentRoll = req.studentRoll || req.student?.roll || 'N/A';
            const studentPhone = req.phone || req.student?.phone;
            const branch = req.branch || req.student?.branch || '';
            const classYear = req.classYear || req.student?.classYear || '';

            return (
              <div 
                key={req._id}
                className="p-5 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#BFDBFE] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-extrabold border border-[#BFDBFE] shrink-0">
                    <Dumbbell size={22} />
                  </div>

                  <div className="space-y-2">
                    {/* Status Badge Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] uppercase tracking-wider">
                        {req.equipmentCategory || req.equipment?.category || 'Equipment'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Qty: {issuedQty} units
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#0F172A]">
                      {req.equipmentName || req.equipment?.name || 'Sports Equipment'}
                    </h3>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 pt-2 border-t border-[#F1F5F9] text-[11px] text-[#52657A]">
                      {/* Student Info */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block">Student:</span>
                        <strong className="text-[#0F172A] flex items-center gap-1 font-bold">
                          <User size={12} className="text-[#2563EB]" />
                          {studentName} ({studentRoll})
                        </strong>
                        <span className="text-[10px] text-[#64748B] block truncate" title={studentEmail}>
                          {studentEmail}
                        </span>
                      </div>

                      {/* Contact & Academic */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block">Contact & Academic:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-[#0F172A]">
                          <Phone size={11} className="text-emerald-600" />
                          <span>{studentPhone || <span className="text-amber-700 italic">No phone</span>}</span>
                        </div>
                        {(branch || classYear) && (
                          <span className="text-[10px] text-[#64748B] block">
                            {branch} {classYear}
                          </span>
                        )}
                      </div>

                      {/* Schedule & Timing */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block">Reservation Slot:</span>
                        <span className="flex items-center gap-1 font-medium text-[#0F172A]">
                          <Calendar size={11} className="text-[#94A3B8]" /> Date: {req.date}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-[#52657A]">
                          <Clock size={11} className="text-[#94A3B8]" /> {req.collectionTime} → {req.returnTime}
                        </span>
                      </div>
                    </div>

                    {/* Return Requested Callout */}
                    {isReturnRequested && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                          <span>
                            Student reported return{req.returnRequestedAt ? ` on ${new Date(req.returnRequestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}. Physically inspect gear and confirm return.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Return Issue Callout */}
                    {isReturnIssue && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-950">
                          <AlertCircle size={14} className="text-rose-600 shrink-0" />
                          <span>Return Issue Flagged — Requires Review</span>
                        </div>
                        <p className="text-rose-800 text-[11px]">
                          Condition: <strong>{req.returnCondition || 'Damaged'}</strong>
                          {req.quantityDamaged > 0 && ` • Damaged: ${req.quantityDamaged} units`}
                          {req.quantityMissing > 0 && ` • Missing: ${req.quantityMissing} units`}
                          {req.returnNotes && ` • Notes: "${req.returnNotes}"`}
                        </p>
                      </div>
                    )}

                    {/* Returned Completed Info */}
                    {isReturned && (
                      <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>
                          Return confirmed{req.returnConfirmedAt ? ` on ${new Date(req.returnConfirmedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''} by {req.returnConfirmedBy || 'admin'}. Usable restored: {req.quantityReturned ?? req.quantity} units.
                        </span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Admin Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  
                  {/* PENDING: Approve / Reject */}
                  {isPending && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading === req._id}
                        onClick={() => handleApprove(req._id)}
                        className="btn bg-[#2563EB] text-white hover:bg-[#1D4ED8] px-4 py-2 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading === req._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading === req._id}
                        onClick={() => handleReject(req._id)}
                        className="btn border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {/* APPROVED: Issue Equipment or Directly Confirm Return */}
                  {isApproved && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading === req._id}
                        onClick={() => handleIssue(req._id)}
                        className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                        title="Mark equipment as physically issued out to student"
                      >
                        {actionLoading === req._id ? <Loader2 size={14} className="animate-spin" /> : <Dumbbell size={14} />}
                        <span>Mark as Issued</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReturnModalBooking(req)}
                        className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Directly confirm physical return"
                      >
                        <RotateCcw size={14} />
                        <span>Confirm Return</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading === req._id}
                        onClick={() => handleReject(req._id)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {/* ISSUED or RETURN REQUESTED or RETURN ISSUE: Confirm Return & Inspection */}
                  {(isIssued || isReturnRequested || isReturnIssue) && (
                    <>
                      <button
                        type="button"
                        onClick={() => setReturnModalBooking(req)}
                        className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        <span>Confirm Return</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReturnModalBooking(req)}
                        className="btn border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Report damage or missing equipment items"
                      >
                        <AlertTriangle size={13} className="text-amber-600" />
                        <span>Damaged / Missing</span>
                      </button>
                    </>
                  )}

                  {/* RETURNED / REJECTED / CANCELLED: Delete */}
                  {(isReturned || isRejected || isCancelled) && (
                    <button
                      type="button"
                      disabled={actionLoading === req._id}
                      onClick={() => handleDelete(req._id)}
                      className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9] text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Equipment Return Modal */}
      <AdminEquipmentReturnModal
        isOpen={!!returnModalBooking}
        onClose={() => setReturnModalBooking(null)}
        booking={returnModalBooking}
        onSuccess={(updated, inventory) => {
          setRequests((prev) =>
            prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r))
          );
          setToast({
            message: `Return confirmed! ${inventory.usableRestored ?? updated.quantityReturned} usable units restored to active campus inventory.`,
            type: 'success',
          });
          fetchEquipmentBookings();
        }}
      />

    </div>
  );
}

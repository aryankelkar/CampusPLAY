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
  Package
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function AdminEquipmentList() {
  const { socket } = useSocket();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchEquipmentBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/equipment-bookings');
      setRequests(data?.data?.bookings || []);
    } catch {
      setRequests([]);
    } flex: {
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
    socket.on('equipment-booking:rejected', refresh);
    socket.on('equipment-booking:cancelled', refresh);
    socket.on('equipment-booking:deleted', refresh);

    return () => {
      socket.off('equipment-booking:created', refresh);
      socket.off('equipment-booking:approved', refresh);
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
    return requests.filter((r) => {
      const matchFilter = filter === 'all' || r.status === filter;
      const q = search.toLowerCase();
      const matchSearch = 
        (r.equipmentName || r.equipment?.name || '').toLowerCase().includes(q) ||
        (r.studentName || r.student?.name || '').toLowerCase().includes(q) ||
        (r.studentRoll || r.student?.roll || '').toLowerCase().includes(q) ||
        (r.date || '').includes(q);

      return matchFilter && matchSearch;
    });
  }, [requests, filter, search]);

  return (
    <div className="space-y-5 font-inter">
      
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

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {['all', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st as any)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filter === st
                  ? 'bg-[#2563EB] text-white font-extrabold shadow-xs'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search student or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
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
            const isApproved = req.status === 'Approved';
            const isRejected = req.status === 'Rejected';
            const isCancelled = req.status === 'Cancelled';

            return (
              <div 
                key={req._id}
                className="p-5 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#BFDBFE] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-extrabold border border-[#BFDBFE] shrink-0">
                    <Dumbbell size={20} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] uppercase tracking-wider">
                        {req.equipmentCategory || req.equipment?.category || 'Equipment'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                        isPending ? 'bg-[#FEF3C7] text-[#92400E]' :
                        isApproved ? 'bg-emerald-100 text-emerald-800' :
                        isRejected ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#0F172A]">
                      {req.equipmentName || req.equipment?.name || 'Sports Equipment'}
                    </h3>

                    <div className="text-xs text-[#2563EB] font-extrabold mt-0.5">
                      Requested Quantity: {req.quantity} units
                    </div>

                    {/* Student Snapshot Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[#52657A] font-medium pt-2 border-t border-[#F1F5F9]">
                      <span className="flex items-center gap-1 font-bold text-[#0F172A]">
                        <User size={13} className="text-[#2563EB]" />
                        {req.studentName || req.student?.name || 'Student'} ({req.studentRoll || req.student?.roll || 'N/A'})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-[#94A3B8]" /> Date: {req.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-[#94A3B8]" /> Time: {req.collectionTime} → {req.returnTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading === req._id}
                        onClick={() => handleApprove(req._id)}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        {actionLoading === req._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading === req._id}
                        onClick={() => handleReject(req._id)}
                        className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100 text-xs font-extrabold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {(isApproved || isRejected || isCancelled) && (
                    <button
                      type="button"
                      disabled={actionLoading === req._id}
                      onClick={() => handleDelete(req._id)}
                      className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9] text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
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

    </div>
  );
}

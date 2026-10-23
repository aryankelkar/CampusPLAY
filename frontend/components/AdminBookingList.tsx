import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import AdminTabs from './AdminTabs';
import ConfirmModal from './common/ConfirmModal';
import Loader from './common/Loader';
import EmptyState from './common/EmptyState';
import StatusTag from './common/StatusTag';
import AcademicVerificationPanel from './timetable/AcademicVerificationPanel';
import { getDisplayTime } from '../utils/helpers';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  User,
  Trophy,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface Booking {
  _id: string;
  game: string;
  ground: string;
  date: string;
  time?: string;
  timeSlots?: string[];
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  name?: string;
  roll?: string;
  email?: string;
  branch?: string;
  division?: string;
  classYear?: string;
  student?: {
    name?: string;
    roll?: string;
    email?: string;
    branch?: string;
    division?: string;
    classYear?: string;
  };
  teamMembers?: Array<{
    name: string;
    roll: string;
    email: string;
  }>;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
}

interface AdminBookingListProps {
  statusFilter: 'Pending' | 'Approved' | 'Rejected';
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  showActions?: 'pending' | 'approved' | 'rejected' | 'none';
}

export default function AdminBookingList({
  statusFilter,
  title,
  subtitle,
  emptyTitle,
  emptySubtitle,
  showActions = 'pending'
}: AdminBookingListProps) {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ 
    id: string; 
    action: 'approve' | 'reject' | 'pending' 
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings');
      const all = data?.data?.bookings || [];
      setRows(all.filter((b: Booking) => b.status === statusFilter));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        window.location.href = '/login';
        return;
      }
      setRows([]);
    } finally { 
      setLoading(false); 
    }
  }, [statusFilter]);

  useEffect(() => { 
    load(); 
  }, [load]);

  const act = async (id: string, action: 'approve' | 'reject' | 'pending') => {
    try {
      setActionLoading(id);
      await api.patch(`/bookings/${id}/${action}`);
      await load();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        window.location.href = '/login';
        return;
      }
    } finally {
      setActionLoading(null);
    }
  };

  const requestConfirm = (id: string, action: 'approve' | 'reject' | 'pending') => { 
    setConfirmTarget({ id, action }); 
    setConfirmOpen(true); 
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-transparent text-[#0F172A] font-inter py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Eyebrow Header */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-[11px] font-extrabold uppercase tracking-[0.08em] mb-1.5 border border-[#BFDBFE]">
            Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-1">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-[#52657A] font-normal leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Main Card Workspace */}
        <div className="bg-white rounded-[22px] border border-[#E8EEF5] p-5 sm:p-7 shadow-[6px_6px_18px_rgba(148,163,184,0.14),-6px_-6px_18px_rgba(255,255,255,0.9)]">
          
          <div className="flex justify-center mb-6">
            <AdminTabs />
          </div>

          {loading ? (
            <Loader className="py-8" />
          ) : rows.length === 0 ? (
            <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const isExpanded = Boolean(expanded[r._id]);
                const studentName = r.name || r.student?.name || '-';
                const studentRoll = r.roll || r.student?.roll || '';

                return (
                  <div 
                    key={r._id} 
                    className="bg-white rounded-[16px] border border-[#E8EEF5] p-4 font-inter hover:border-[#BFDBFE] hover:bg-[#F8FBFF] transition-all duration-200 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 flex-wrap sm:flex-nowrap">
                        <div className="w-24 flex-shrink-0">
                          <StatusTag status={r.status} />
                        </div>

                        <div className="flex-1 min-w-[180px]">
                          <div className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1.5">
                            <User size={13} className="text-[#2563EB]" />
                            <span>{studentName}</span>
                            {studentRoll && <span className="text-[#52657A] font-semibold text-[11px]">({studentRoll})</span>}
                          </div>
                          <div className="text-[11px] text-[#52657A] font-medium flex items-center gap-1 mt-0.5">
                            <Trophy size={12} className="text-[#2563EB]" />
                            <span className="font-bold text-[#0F172A]">{r.game}</span>
                            <span>•</span>
                            <MapPin size={12} className="text-[#2563EB]" />
                            <span>{r.ground}</span>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-[#52657A] flex items-center gap-2 flex-shrink-0">
                          <span className="flex items-center gap-1 text-[#0F172A] font-bold">
                            <Calendar size={13} className="text-[#2563EB]" />
                            {r.date}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[#2563EB] font-bold">
                            <Clock size={13} />
                            {getDisplayTime(r)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8EEF5]">
                        <button 
                          className="btn text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1 transition-all" 
                          onClick={() => setExpanded({ ...expanded, [r._id]: !isExpanded })}
                        >
                          <span>{isExpanded ? 'Hide' : 'View'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-[#E8EEF5] space-y-4 animate-in fade-in duration-200 text-xs">
                        {/* Academic Profile, Timetable Conflict Verification, and Squad Members Panel */}
                        <AcademicVerificationPanel booking={r} />

                        {showActions !== 'none' && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8EEF5]">
                            {showActions === 'pending' && (
                              <>
                                <button 
                                  onClick={() => requestConfirm(r._id, 'approve')} 
                                  disabled={actionLoading === r._id}
                                  className="btn btn-primary px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-[10px] flex items-center gap-1.5 text-white"
                                >
                                  {actionLoading === r._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                  <span>APPROVE</span>
                                </button>
                                <button 
                                  onClick={() => requestConfirm(r._id, 'reject')} 
                                  disabled={actionLoading === r._id}
                                  className="btn text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-[10px] flex items-center gap-1.5"
                                >
                                  <XCircle size={14} />
                                  <span>REJECT</span>
                                </button>
                              </>
                            )}
                            {showActions === 'approved' && (
                              <button 
                                onClick={() => requestConfirm(r._id, 'pending')} 
                                disabled={actionLoading === r._id}
                                className="btn text-[#D97706] bg-[#FEF3C7]/60 hover:bg-[#FEF3C7] border border-[#FDE68A] px-3.5 py-2 text-xs font-bold rounded-[10px] flex items-center gap-1"
                              >
                                <RotateCcw size={13} />
                                <span>Revoke to Pending</span>
                              </button>
                            )}
                            {showActions === 'rejected' && (
                              <button 
                                onClick={() => requestConfirm(r._id, 'pending')} 
                                disabled={actionLoading === r._id}
                                className="btn text-[#D97706] bg-[#FEF3C7]/60 hover:bg-[#FEF3C7] border border-[#FDE68A] px-3.5 py-2 text-xs font-bold rounded-[10px] flex items-center gap-1"
                              >
                                <RotateCcw size={13} />
                                <span>Reconsider</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        <ConfirmModal
          open={confirmOpen}
          title={
            confirmTarget?.action === 'approve' ? 'Approve Booking?' : 
            confirmTarget?.action === 'reject' ? 'Reject Booking?' : 'Move to Pending?'
          }
          description={<div className="text-xs text-[#52657A]">Confirm update status for this booking record?</div>}
          confirmText="Confirm"
          cancelText="Cancel"
          onCancel={() => { 
            setConfirmOpen(false); 
            setConfirmTarget(null); 
          }}
          onConfirm={async () => {
            if (confirmTarget) await act(confirmTarget.id, confirmTarget.action);
            setConfirmOpen(false);
            setConfirmTarget(null);
          }}
        />
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusTag from '../../components/common/StatusTag';
import AdminTabs from '../../components/AdminTabs';
import AdminEquipmentList from '../../components/AdminEquipmentList';
import AdminFacilityList from '../../components/AdminFacilityList';
import AdminTimetableManagement from '../../components/timetable/AdminTimetableManagement';
import AcademicVerificationPanel from '../../components/timetable/AcademicVerificationPanel';
import { getDisplayTime } from '../../utils/helpers';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  ShieldCheck,
  Trophy,
  MapPin,
  Calendar,
  Clock,
  User,
  X,
  AlertCircle,
  Loader2,
  Dumbbell,
  Building2,
  CalendarCheck,
  ArrowUpDown,
  History
} from 'lucide-react';
import { sortBookings, SortDateOption } from '../../utils/dateSorting';
import { getTodayDate } from '../../utils/helpers';

export default function AdminDashboardPage() {
  const [activeModule, setActiveModule] = useState<'grounds' | 'equipment' | 'facilities' | 'timetable'>('grounds');

  return (
    <ProtectedRoute role="admin">
      <div className="w-full text-[#0F172A] font-inter py-2">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Admin Eyebrow & Title */}
          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-[11px] font-extrabold uppercase tracking-[0.08em] mb-1.5 border border-[#BFDBFE]">
              Administration Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-1 uppercase">
              Admin Operations
            </h1>
            <p className="text-xs sm:text-sm text-[#52657A] font-normal leading-relaxed">
              Review and manage campus sports facility reservations, equipment inventory requests, and campus facility status.
            </p>
          </div>

          {/* Module Switcher */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1.5 bg-[#E2E8F0] rounded-2xl border border-[#CBD5E1] flex-wrap justify-center gap-1">
              <button
                onClick={() => setActiveModule('grounds')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                  activeModule === 'grounds'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#52657A] hover:text-[#0F172A]'
                }`}
              >
                <Trophy size={15} />
                <span>Facility Bookings</span>
              </button>
              <button
                onClick={() => setActiveModule('equipment')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                  activeModule === 'equipment'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#52657A] hover:text-[#0F172A]'
                }`}
              >
                <Dumbbell size={15} />
                <span>Equipment Requests</span>
              </button>
              <button
                onClick={() => setActiveModule('facilities')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                  activeModule === 'facilities'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#52657A] hover:text-[#0F172A]'
                }`}
              >
                <Building2 size={15} />
                <span>Facilities Setup</span>
              </button>
              <button
                onClick={() => setActiveModule('timetable')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                  activeModule === 'timetable'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#52657A] hover:text-[#0F172A]'
                }`}
              >
                <CalendarCheck size={15} />
                <span>Academic Timetable</span>
              </button>
            </div>
          </div>

          {activeModule === 'grounds' ? (
            <AdminDashboard />
          ) : activeModule === 'equipment' ? (
            <AdminEquipmentList />
          ) : activeModule === 'facilities' ? (
            <AdminFacilityList />
          ) : (
            <AdminTimetableManagement />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'>('all');
  const [query, setQuery] = useState('');
  const [timeScope, setTimeScope] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortDateOption>('event-desc');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; action: 'approve' | 'reject' | 'pending' | 'delete'; row?: any } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStatusFilterChange = (status: 'all' | 'Pending' | 'Approved' | 'Rejected') => {
    setStatusFilter(status);
    if (router.isReady) {
      const nextQuery = { ...router.query };
      if (status === 'all') {
        delete nextQuery.status;
      } else {
        nextQuery.status = status.toLowerCase();
      }
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
    }
  };

  useEffect(() => {
    if (router.isReady && router.query.status) {
      const s = String(router.query.status).toLowerCase();
      if (s === 'pending') setStatusFilter('Pending');
      else if (s === 'approved') setStatusFilter('Approved');
      else if (s === 'rejected') setStatusFilter('Rejected');
      else if (s === 'all' || s === 'overview') setStatusFilter('all');
    }
  }, [router.isReady, router.query.status]);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings');
      setRows(data?.data?.bookings || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = useMemo(() => getTodayDate(), []);

  const upcomingBookingsList = useMemo(() => {
    return rows.filter((r) => !r.date || r.date >= todayStr);
  }, [rows, todayStr]);

  const pastBookingsList = useMemo(() => {
    return rows.filter((r) => r.date && r.date < todayStr);
  }, [rows, todayStr]);

  const currentScopeRows = useMemo(() => {
    if (timeScope === 'upcoming') return upcomingBookingsList;
    if (timeScope === 'past') return pastBookingsList;
    return rows;
  }, [timeScope, upcomingBookingsList, pastBookingsList, rows]);

  const statusCounts = useMemo(() => {
    const base = { all: currentScopeRows.length, Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 } as Record<string, number>;
    for (const r of currentScopeRows) {
      if (base[r.status] !== undefined) base[r.status]++;
    }
    return base;
  }, [currentScopeRows]);

  const uniqueGames = useMemo(() => {
    const set = new Set<string>();
    for (const r of currentScopeRows) if (r.game) set.add(r.game);
    return ['all', ...Array.from(set)];
  }, [currentScopeRows]);

  const datesWithBookings = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of currentScopeRows) {
      if (r.date) {
        map.set(r.date, (map.get(r.date) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => 
      timeScope === 'past' ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0])
    );
  }, [currentScopeRows, timeScope]);

  const hasActiveFilters = Boolean(query || gameFilter !== 'all' || selectedDate);
  const handleClearAllFilters = () => {
    setQuery('');
    setGameFilter('all');
    setSelectedDate('');
  };

  const handleTimeScopeChange = (newScope: 'upcoming' | 'past' | 'all') => {
    setTimeScope(newScope);
    setSelectedDate('');
    setStatusFilter('all');
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'approve' | 'reject' | 'pending' | 'delete', reason?: string) => {
    try {
      setActionLoading(id);
      let response;
      
      if (action === 'delete') {
        await api.delete(`/bookings/${id}`);
        setRows((prev) => prev.filter((r) => r._id !== id));
        setToast({ message: 'Booking record deleted.', type: 'success' });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      
      if (action === 'reject') {
        response = await api.patch(`/bookings/${id}/reject`, { reason: reason || '' });
      } else if (action === 'approve') {
        response = await api.patch(`/bookings/${id}/approve`);
      } else {
        response = await api.patch(`/bookings/${id}/pending`);
      }
      
      const updatedBooking = response.data?.data?.booking;
      
      if (updatedBooking) {
        setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...updatedBooking } : r)));
      }
      
      const messages = {
        approve: 'BOOKING APPROVED successfully.',
        reject: 'BOOKING REJECTED successfully.',
        pending: 'Decision revoked — moved to Pending review.'
      };
      
      setToast({ message: messages[action as keyof typeof messages], type: 'success' });
      setTimeout(() => setToast(null), 3000);
      
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Action failed.';
      setToast({ message: `⚠️ ${errorMessage}`, type: 'error' });
      setTimeout(() => setToast(null), 4000);
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const requestConfirm = (id: string, action: 'approve' | 'reject' | 'pending' | 'delete', row?: any) => {
    setConfirmTarget({ id, action, row });
    if (action === 'reject') setRejectReason('');
    setConfirmOpen(true);
  };

  const filteredRows = useMemo(() => {
    let list = statusFilter === 'all' ? currentScopeRows : currentScopeRows.filter((r) => r.status === statusFilter);
    if (gameFilter !== 'all') list = list.filter((r) => r.game === gameFilter);
    if (selectedDate) list = list.filter((r) => r.date === selectedDate);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) =>
        (r.game || '').toLowerCase().includes(q) ||
        (r.ground || '').toLowerCase().includes(q) ||
        (r.name || r.student?.name || '').toLowerCase().includes(q) ||
        (r.roll || '').toLowerCase().includes(q) ||
        (r.date || '').toLowerCase().includes(q)
      );
    }
    return sortBookings(list, sortBy);
  }, [currentScopeRows, statusFilter, query, gameFilter, selectedDate, sortBy]);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-[12px] shadow-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
          toast.type === 'success' 
            ? 'bg-[#2563EB] text-white' 
            : 'bg-rose-600 text-white'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Primary Main Workspace Container */}
      <div className="bg-white rounded-[22px] border border-[#E8EEF5] p-5 sm:p-7 shadow-[6px_6px_18px_rgba(148,163,184,0.14),-6px_-6px_18px_rgba(255,255,255,0.9)]">
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6">
          <AdminTabs 
            activeStatus={statusFilter === 'Cancelled' ? 'all' : statusFilter}
            onStatusChange={handleStatusFilterChange}
          />
        </div>

        {/* Time Scope Tabs: Upcoming vs Past Bookings vs All */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 p-2 bg-[#F8FAFC] rounded-[18px] border border-[#E2E8F0]">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleTimeScopeChange('upcoming')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-[12px] text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                timeScope === 'upcoming'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#52657A] hover:text-[#0F172A] hover:bg-white bg-transparent'
              }`}
            >
              <Clock size={14} />
              <span>Upcoming & Today</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                timeScope === 'upcoming' ? 'bg-white/25 text-white' : 'bg-[#E2E8F0] text-[#0F172A]'
              }`}>
                {upcomingBookingsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTimeScopeChange('past')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-[12px] text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                timeScope === 'past'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#52657A] hover:text-[#0F172A] hover:bg-white bg-transparent'
              }`}
            >
              <History size={14} />
              <span>Past Bookings</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                timeScope === 'past' ? 'bg-white/25 text-white' : 'bg-[#E2E8F0] text-[#0F172A]'
              }`}>
                {pastBookingsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTimeScopeChange('all')}
              className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-[12px] text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                timeScope === 'all'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#52657A] hover:text-[#0F172A] hover:bg-white bg-transparent'
              }`}
            >
              <span>All Records</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                timeScope === 'all' ? 'bg-white/25 text-white' : 'bg-[#E2E8F0] text-[#0F172A]'
              }`}>
                {rows.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] font-semibold text-[#64748B] px-3 py-1 flex items-center gap-2 self-center sm:self-auto">
            {timeScope === 'upcoming' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active & Future Slots ({upcomingBookingsList.length})</span>
              </>
            ) : timeScope === 'past' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Past Records ({pastBookingsList.length})</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span>All Combined Records ({rows.length})</span>
              </>
            )}
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          <button 
            type="button"
            className={`p-4 rounded-[16px] border text-left transition-all duration-200 h-[96px] flex flex-col justify-between ${
              statusFilter === 'all' 
                ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] shadow-[inset_0_2px_4px_rgba(37,99,235,0.06)] ring-2 ring-[#2563EB]/20'
                : 'border-[#E8EEF5] bg-white hover:bg-slate-50 text-[#0F172A]'
            }`} 
            onClick={() => handleStatusFilterChange('all')}
          >
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#52657A]">Total Requests</div>
            <div className="text-2xl font-extrabold text-[#0F172A]">{statusCounts.all}</div>
          </button>

          <button 
            type="button"
            className={`p-4 rounded-[16px] border text-left transition-all duration-200 h-[96px] flex flex-col justify-between ${
              statusFilter === 'Pending' 
                ? 'border-[#D97706] bg-[#FEF3C7]/50 text-[#D97706] shadow-[inset_0_2px_4px_rgba(217,119,6,0.06)] ring-2 ring-[#D97706]/20'
                : 'border-[#E8EEF5] bg-white hover:bg-slate-50 text-[#0F172A]'
            }`} 
            onClick={() => handleStatusFilterChange('Pending')}
          >
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#D97706]">Pending</div>
            <div className="text-2xl font-extrabold text-[#D97706]">{statusCounts.Pending}</div>
          </button>

          <button 
            type="button"
            className={`p-4 rounded-[16px] border text-left transition-all duration-200 h-[96px] flex flex-col justify-between ${
              statusFilter === 'Approved' 
                ? 'border-[#10B981] bg-[#D1FAE5]/50 text-[#10B981] shadow-[inset_0_2px_4px_rgba(16,185,129,0.06)] ring-2 ring-[#10B981]/20'
                : 'border-[#E8EEF5] bg-white hover:bg-slate-50 text-[#0F172A]'
            }`} 
            onClick={() => handleStatusFilterChange('Approved')}
          >
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#10B981]">Approved</div>
            <div className="text-2xl font-extrabold text-[#10B981]">{statusCounts.Approved}</div>
          </button>

          <button 
            type="button"
            className={`p-4 rounded-[16px] border text-left transition-all duration-200 h-[96px] flex flex-col justify-between ${
              statusFilter === 'Rejected' 
                ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-[inset_0_2px_4px_rgba(244,63,94,0.06)] ring-2 ring-rose-500/20'
                : 'border-[#E8EEF5] bg-white hover:bg-slate-50 text-[#0F172A]'
            }`} 
            onClick={() => handleStatusFilterChange('Rejected')}
          >
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">Rejected</div>
            <div className="text-2xl font-extrabold text-rose-600">{statusCounts.Rejected}</div>
          </button>
        </div>

        {/* Controls: Search + Calendar Date Filter + Sport Filter + Sort */}
        <div className="mb-6 p-4 sm:p-5 rounded-[20px] bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs space-y-3.5">
          {/* Top Row: Full-Width Search Input */}
          <div className="relative w-full">
            <input 
              type="text"
              aria-label="Search bookings" 
              className="w-full !pl-10 !pr-10 py-2.5 text-xs font-semibold h-[46px] rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs" 
              placeholder="Search by student name, roll number, sport, ground, date..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
            {query && (
              <button 
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-full transition-colors cursor-pointer"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bottom Controls Row: 3 Pillars (Calendar Date, Sport, Sort) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            
            {/* 1. Calendar Date Picker Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#2563EB]" />
                  <span>Calendar Date Filter</span>
                </span>
                {selectedDate && (
                  <button 
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Clear Date
                  </button>
                )}
              </label>
              <div className="relative">
                <input 
                  type="date"
                  aria-label="Filter by date on calendar"
                  min={timeScope === 'upcoming' ? todayStr : undefined}
                  max={timeScope === 'past' ? todayStr : undefined}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`w-full !pl-9 !pr-8 py-2 text-xs font-bold h-[44px] rounded-[12px] border bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs cursor-pointer ${
                    selectedDate ? 'border-[#2563EB] ring-1 ring-[#2563EB]/20 bg-[#EFF6FF]/40' : 'border-[#DCE6F0]'
                  }`}
                />
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB] pointer-events-none" />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    title="Reset date"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-1 rounded-full transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Sport Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <Trophy size={12} className="text-[#2563EB]" />
                <span>Filter by Sport</span>
              </label>
              <div className="relative">
                <select 
                  aria-label="Filter by sport" 
                  className={`w-full !pl-9 !pr-8 py-2 text-xs font-bold h-[44px] rounded-[12px] border bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs cursor-pointer ${
                    gameFilter !== 'all' ? 'border-[#2563EB] ring-1 ring-[#2563EB]/20 bg-[#EFF6FF]/40' : 'border-[#DCE6F0]'
                  }`}
                  value={gameFilter} 
                  onChange={(e) => setGameFilter(e.target.value)}
                >
                  {uniqueGames.map((g) => (
                    <option key={g} value={g}>{g === 'all' ? 'All Sports' : g}</option>
                  ))}
                </select>
                <Trophy size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB] pointer-events-none" />
              </div>
            </div>

            {/* 3. Sort by Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <ArrowUpDown size={12} className="text-[#2563EB]" />
                <span>Sort Bookings</span>
              </label>
              <div className="relative">
                <select 
                  aria-label="Sort bookings by date" 
                  className="w-full !pl-9 !pr-8 py-2 text-xs font-bold h-[44px] rounded-[12px] border border-[#DCE6F0] bg-white text-[#0F172A] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs cursor-pointer" 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortDateOption)}
                >
                  <option value="event-desc">Event Date: Latest First</option>
                  <option value="event-asc">Event Date: Earliest First</option>
                  <option value="created-desc">Request Date: Newest First</option>
                  <option value="created-asc">Request Date: Oldest First</option>
                </select>
                <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB] pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Quick Date Pills: Dates with active bookings */}
          {datesWithBookings.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-[#E8EEF5]">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-1 mr-1">
                <CalendarCheck size={13} className="text-[#2563EB]" />
                <span>Dates with Bookings:</span>
              </span>
              {datesWithBookings.map(([d, count]) => {
                const isSelected = selectedDate === d;
                const formatted = new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                });
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? '' : d)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-white hover:bg-[#EFF6FF] text-[#0F172A] border border-[#CBD5E1] hover:border-[#BFDBFE]'
                    }`}
                  >
                    <span>{formatted}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-[#EFF6FF] text-[#2563EB]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline ml-auto flex items-center gap-1 cursor-pointer"
                >
                  <X size={12} />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Requests Queue List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-[16px] bg-[#EFF6FF] border border-[#BFDBFE]/50" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[20px] max-w-lg mx-auto">
            <CalendarCheck size={36} className="mx-auto text-[#94A3B8] mb-2" />
            <h3 className="text-sm font-extrabold text-[#0F172A] mb-1 uppercase">
              {selectedDate 
                ? `No Bookings on ${selectedDate}` 
                : timeScope === 'upcoming' 
                  ? 'No Upcoming Bookings' 
                  : timeScope === 'past'
                    ? 'No Past Bookings Found'
                    : 'No Requests Found'}
            </h3>
            <p className="text-xs text-[#64748B] mb-4 max-w-sm mx-auto">
              {selectedDate
                ? "There are no reservation requests scheduled for this selected calendar date."
                : timeScope === 'upcoming'
                  ? "There are currently no active or upcoming bookings for today onward. Past completed records can be viewed in the Past Bookings tab."
                  : "There are no requests matching your current filter criteria."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {timeScope === 'upcoming' && pastBookingsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTimeScopeChange('past')}
                  className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl hover:bg-[#1D4ED8] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <History size={13} />
                  <span>View Past Bookings ({pastBookingsList.length})</span>
                </button>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="px-4 py-2 bg-white text-[#2563EB] border border-[#BFDBFE] text-xs font-bold rounded-xl hover:bg-[#EFF6FF] transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <X size={13} />
                  <span>Clear Active Filters</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRows.map((r) => {
              const isExpanded = Boolean(expanded[r._id]);
              const studentName = r.name || r.student?.name || '-';
              const studentRoll = r.roll || r.student?.roll || '';
              
              return (
                <div
                  key={r._id}
                  className="bg-white rounded-[16px] border border-[#E8EEF5] p-4 font-inter hover:border-[#BFDBFE] hover:bg-[#F8FBFF] transition-all duration-200 shadow-xs"
                >
                  {/* Compact High-Density Row Header */}
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

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#E8EEF5] space-y-4 animate-in fade-in duration-200 text-xs">
                      
                      {/* Academic Profile, Timetable Conflict Verification, and Squad Members Panel */}
                      <AcademicVerificationPanel booking={r} />

                      {/* Admin Approval Actions Bar */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8EEF5]">
                        {r.status === 'Pending' && (
                          <>
                            <button 
                              onClick={() => requestConfirm(r._id, 'approve', r)} 
                              disabled={actionLoading === r._id}
                              className="btn btn-primary px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-[10px] flex items-center gap-1.5 text-white shadow-xs"
                            >
                              {actionLoading === r._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                              <span>APPROVE REQUEST</span>
                            </button>
                            
                            <button 
                              onClick={() => requestConfirm(r._id, 'reject', r)} 
                              disabled={actionLoading === r._id}
                              className="btn text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-[10px] flex items-center gap-1.5"
                            >
                              <XCircle size={14} />
                              <span>REJECT REQUEST</span>
                            </button>
                          </>
                        )}
                        
                        {r.status === 'Approved' && (
                          <>
                            <button 
                              onClick={() => requestConfirm(r._id, 'pending', r)} 
                              disabled={actionLoading === r._id}
                              className="btn text-[#D97706] bg-[#FEF3C7]/60 hover:bg-[#FEF3C7] border border-[#FDE68A] px-3.5 py-2 text-xs font-bold rounded-[10px] flex items-center gap-1"
                            >
                              <RotateCcw size={13} />
                              <span>Revoke to Pending</span>
                            </button>
                            
                            <button 
                              onClick={() => requestConfirm(r._id, 'reject', r)} 
                              disabled={actionLoading === r._id}
                              className="btn text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 text-xs font-bold rounded-[10px]"
                            >
                              Mark Rejected
                            </button>
                          </>
                        )}
                        
                        {r.status === 'Rejected' && (
                          <>
                            <button 
                              onClick={() => requestConfirm(r._id, 'pending', r)} 
                              disabled={actionLoading === r._id}
                              className="btn text-[#D97706] bg-[#FEF3C7]/60 hover:bg-[#FEF3C7] border border-[#FDE68A] px-3.5 py-2 text-xs font-bold rounded-[10px] flex items-center gap-1"
                            >
                              <RotateCcw size={13} />
                              <span>Revoke Decision</span>
                            </button>
                            
                            <button 
                              onClick={() => requestConfirm(r._id, 'approve', r)} 
                              disabled={actionLoading === r._id}
                              className="btn btn-primary px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider rounded-[10px] text-white"
                            >
                              Approve Slot
                            </button>
                          </>
                        )}
                        
                        {(r.status === 'Rejected' || r.status === 'Cancelled') && (
                          <button 
                            onClick={() => requestConfirm(r._id, 'delete', r)} 
                            disabled={actionLoading === r._id}
                            className="btn text-[#52657A] bg-[#F8FAFC] hover:bg-slate-100 border border-[#DCE6F0] px-3.5 py-2 text-xs font-bold rounded-[10px] flex items-center gap-1 ml-auto"
                          >
                            <Trash2 size={13} />
                            <span>Delete Record</span>
                          </button>
                        )}
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmOpen}
        title={
          confirmTarget?.action === 'approve' ? 'APPROVE BOOKING REQUEST?' : 
          confirmTarget?.action === 'reject' ? 'REJECT BOOKING REQUEST' : 
          confirmTarget?.action === 'delete' ? 'DELETE BOOKING RECORD?' :
          'REVOKE DECISION?'
        }
        description={confirmTarget ? (
          <div className="text-xs space-y-2.5">
            {confirmTarget.action === 'approve' ? (
              <>
                <p className="text-[#52657A]">Approve slot reservation for <strong className="text-[#0F172A]">{confirmTarget.row?.name || confirmTarget.row?.student?.name || 'Student'}</strong>:</p>
                <div className="bg-[#EFF6FF] p-3 rounded-[12px] border border-[#BFDBFE] text-[#0F172A] space-y-0.5">
                  <div className="font-extrabold text-sm">{confirmTarget.row?.game} at {confirmTarget.row?.ground}</div>
                  <div className="text-xs text-[#2563EB] font-bold">{confirmTarget.row?.date} • {getDisplayTime(confirmTarget.row)}</div>
                </div>
              </>
            ) : confirmTarget.action === 'reject' ? (
              <>
                <p className="text-[#52657A]">Optionally specify rejection reason:</p>
                <textarea 
                  className="input text-xs py-2 px-3 h-20 w-full rounded-[10px] border border-[#DCE6F0]" 
                  placeholder="E.g. Ground undergoing scheduled campus maintenance." 
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)} 
                />
              </>
            ) : confirmTarget.action === 'delete' ? (
              <p className="text-[#52657A]">Permanently remove this booking record from the system database?</p>
            ) : (
              <p className="text-[#52657A]">Revert this booking request back to Pending status for review?</p>
            )}
          </div>
        ) : null}
        confirmText={
          confirmTarget?.action === 'approve' ? 'Approve Request' : 
          confirmTarget?.action === 'reject' ? 'Reject Request' : 
          confirmTarget?.action === 'delete' ? 'Delete Record' :
          'Revoke'
        }
        cancelText="Cancel"
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={async () => {
          if (confirmTarget) {
            await act(confirmTarget.id, confirmTarget.action, confirmTarget.action === 'reject' ? rejectReason : undefined);
          }
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />

    </div>
  );
}

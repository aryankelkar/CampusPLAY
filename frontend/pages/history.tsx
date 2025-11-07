import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../lib/api';
import BookingCard from '../components/BookingCard';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import { BOOKING_STATUS } from '../constants';
import { getTodayDate, getMonthYearLabel } from '../utils/helpers';

export default function HistoryPage() {
  return (
    <ProtectedRoute role="student">
      <BookingHistory />
    </ProtectedRoute>
  );
}

function BookingHistory() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'pending' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings');
      setBookings(data?.data?.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchBookings(); 
    
    // Auto-refresh every 30 seconds to catch admin updates
    const interval = setInterval(() => {
      fetchBookings();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const today = useMemo(() => getTodayDate(), []);
  
  // All bookings (sorted by date, newest first)
  const allBookings = useMemo(() =>
    (bookings || [])
      .sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)))
  , [bookings]);

  // Approved bookings (all approved, regardless of date)
  const approved = useMemo(() =>
    allBookings.filter((b) => b.status === BOOKING_STATUS.APPROVED)
  , [allBookings]);

  // Rejected bookings (all rejected)
  const rejected = useMemo(() =>
    allBookings.filter((b) => b.status === BOOKING_STATUS.REJECTED)
  , [allBookings]);

  // Pending bookings (all pending)
  const pending = useMemo(() =>
    allBookings.filter((b) => b.status === BOOKING_STATUS.PENDING)
  , [allBookings]);

  // Cancelled bookings (all cancelled)
  const cancelled = useMemo(() =>
    allBookings.filter((b) => b.status === BOOKING_STATUS.CANCELLED)
  , [allBookings]);
  
  // Get filtered bookings based on selected filter
  const filteredBookings = useMemo(() => {
    if (filter === 'approved') return approved;
    if (filter === 'rejected') return rejected;
    if (filter === 'pending') return pending;
    if (filter === 'cancelled') return cancelled;
    return allBookings;
  }, [filter, approved, rejected, pending, cancelled, allBookings]);

  // Apply search filter
  const searchedBookings = useMemo(() => {
    if (!searchQuery.trim()) return filteredBookings;
    const query = searchQuery.toLowerCase();
    return filteredBookings.filter((b) => 
      b.game?.toLowerCase().includes(query) ||
      b.ground?.toLowerCase().includes(query) ||
      b.date?.toLowerCase().includes(query) ||
      b.time?.toLowerCase().includes(query)
    );
  }, [filteredBookings, searchQuery]);

  const previousByMonth = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const b of searchedBookings) {
      const d = new Date(b.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    }
    const ordered = Object.keys(groups).sort((a,b)=> b.localeCompare(a));
    return ordered.map((k)=> ({ key: k, label: getMonthYearLabel(k), items: groups[k] }));
  }, [searchedBookings]);

  return (
    <div className="min-h-[calc(100vh-120px)] max-w-5xl mx-auto pt-6">

      {/* Search Bar */}
      {!loading && allBookings.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by game, ground, date or time..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && allBookings.length > 0 && (
        <div className="rounded-2xl bg-white/90 backdrop-blur p-2 shadow-md border border-gray-100 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setFilter('all')}
            >
              All History ({allBookings.length})
            </button>
            <button
              className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === 'approved'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setFilter('approved')}
            >
              ✅ Approved ({approved.length})
            </button>
            <button
              className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === 'rejected'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setFilter('rejected')}
            >
              ❌ Rejected ({rejected.length})
            </button>
            <button
              className={`flex-1 min-w-[120px] px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === 'pending'
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setFilter('pending')}
            >
              🕒 Pending ({pending.length})
            </button>
            <button
              className={`flex-1 min-w-[120px] px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === 'cancelled'
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setFilter('cancelled')}
            >
              🚫 Cancelled ({cancelled.length})
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!loading && allBookings.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              Showing <span className="font-bold text-indigo-600">{searchedBookings.length}</span> of <span className="font-bold">{filteredBookings.length}</span> {filter === 'all' ? 'total' : filter} booking{filteredBookings.length !== 1 ? 's' : ''}
            </div>
            {searchQuery && (
              <div className="text-xs text-gray-500 mt-1">
                Search results for "{searchQuery}"
              </div>
            )}
          </div>
          <Link href="/bookings" className="px-4 py-2 rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 font-medium text-sm shadow-sm hover:shadow transition-all flex items-center gap-2 border border-indigo-200">
            <span>📅</span> Book New Slot
          </Link>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loader className="py-12" />
      ) : (
        <div className="space-y-6">
          {previousByMonth.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">📭</div>
              <div className="text-xl font-semibold text-gray-700 mb-2">
                {filter !== 'all' ? `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Bookings` : 'No bookings yet'}
              </div>
              <div className="text-gray-500 mb-4">
                {filter !== 'all' 
                  ? `You don't have any ${filter} bookings`
                  : 'Your booking history will appear here'}
              </div>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  View All History
                </button>
              )}
            </div>
          ) : (
            previousByMonth.map((group) => (
              <div key={group.key} className="space-y-3">
                {/* Month Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-slate-800">{group.label}</h2>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm font-medium text-gray-500">{group.items.length} booking{group.items.length !== 1 ? 's' : ''}</span>
                </div>
                
                {/* Bookings for this month */}
                <div className="space-y-3">
                  {group.items.map((b: any) => {
                    // Determine tag based on status and date
                    let tag = '';
                    const isPast = b.date < today;
                    const isFuture = b.date >= today;
                    
                    if (b.status === BOOKING_STATUS.APPROVED) {
                      tag = isPast ? '✅ Completed' : '✅ Approved';
                    } else if (b.status === BOOKING_STATUS.REJECTED) {
                      tag = '❌ Rejected';
                    } else if (b.status === BOOKING_STATUS.PENDING) {
                      tag = isPast ? '🕒 Missed (Pending)' : '🕒 Pending';
                    } else if (b.status === BOOKING_STATUS.CANCELLED) {
                      tag = '🚫 Cancelled';
                    }
                    return (
                      <BookingCard key={b._id} booking={b} viewOnly tag={tag} />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

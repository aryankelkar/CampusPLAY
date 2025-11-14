import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../lib/api';
import BookingCard from '../components/BookingCard';
import EmptyState from '../components/common/EmptyState';
import { ListSkeleton } from '../components/common/LoadingSkeleton';
import { BOOKING_STATUS } from '../constants';
import { getTodayDate, getMonthYearLabel } from '../utils/helpers';
import { useSocket } from '../context/SocketContext';

export default function HistoryPage() {
  return (
    <ProtectedRoute role="student">
      <BookingHistory />
    </ProtectedRoute>
  );
}

function BookingHistory() {
  const { socket } = useSocket();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'pending' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

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

  // Real-time Socket.io updates
  useEffect(() => {
    if (!socket) return;

    const handleBookingUpdate = (data: any) => {
      console.log('🔄 Real-time booking update received:', data);
      const updatedBooking = data?.booking;
      
      if (updatedBooking) {
        setBookings((prev) => 
          prev.map((b) => 
            b._id === updatedBooking._id ? { ...b, ...updatedBooking } : b
          )
        );
      }
    };

    // Listen for booking events
    socket.on('booking:cancelled', handleBookingUpdate);
    socket.on('booking:approved', handleBookingUpdate);
    socket.on('booking:rejected', handleBookingUpdate);
    socket.on('booking:created', handleBookingUpdate);

    return () => {
      socket.off('booking:cancelled', handleBookingUpdate);
      socket.off('booking:approved', handleBookingUpdate);
      socket.off('booking:rejected', handleBookingUpdate);
      socket.off('booking:created', handleBookingUpdate);
    };
  }, [socket]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancelling(bookingId);
      const { data } = await api.patch(`/bookings/${bookingId}/cancel`);
      
      // Update local state immediately
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: BOOKING_STATUS.CANCELLED } : b
        )
      );
      
      setToast({ 
        message: '✅ Booking cancelled successfully. Slot is now available again.', 
        type: 'success' 
      });
      
      console.log('✅ Booking cancelled:', bookingId);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Unable to cancel booking. Please try again later.';
      setToast({ 
        message: `⚠️ ${errorMsg}`, 
        type: 'error' 
      });
      console.error('❌ Error cancelling booking:', err);
    } finally {
      setCancelling(null);
    }
  };

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
    <div className="min-h-[calc(100vh-120px)] max-w-5xl mx-auto px-4 py-6 animate-fade-in-up">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 shadow-sm mb-4">
          <span className="text-3xl">📚</span>
        </div>
        <h1 className="page-title mb-2">Booking History</h1>
        <p className="text-muted">View and manage all your bookings</p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl animate-slide-in-right ${
          toast.type === 'success' 
            ? 'bg-secondary-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{toast.type === 'success' ? '✅' : '⚠️'}</span>
            <span className="font-medium">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-75 transition-opacity"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {!loading && allBookings.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by game, ground, date or time..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && allBookings.length > 0 && (
        <div className="card p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                filter === 'all'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setFilter('all')}
            >
              All ({allBookings.length})
            </button>
            <button
              className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                filter === 'approved'
                  ? 'bg-secondary-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setFilter('approved')}
            >
              ✅ Approved ({approved.length})
            </button>
            <button
              className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setFilter('rejected')}
            >
              ❌ Rejected ({rejected.length})
            </button>
            <button
              className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                filter === 'pending'
                  ? 'bg-accent-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setFilter('pending')}
            >
              🕒 Pending ({pending.length})
            </button>
            <button
              className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                filter === 'cancelled'
                  ? 'bg-gray-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
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
        <div className="mb-6 card p-5 bg-gradient-to-r from-primary-50 to-secondary-50">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-primary">
                Showing <span className="font-bold">{searchedBookings.length}</span> of <span className="font-bold">{filteredBookings.length}</span> {filter === 'all' ? 'total' : filter} booking{filteredBookings.length !== 1 ? 's' : ''}
              </div>
              {searchQuery && (
                <div className="text-xs text-muted mt-1">
                  Search results for "{searchQuery}"
                </div>
              )}
            </div>
            <Link href="/bookings" className="btn btn-primary px-5 py-2 flex items-center gap-2">
              <span>📅</span> <span>Book New Slot</span>
            </Link>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <ListSkeleton count={6} />
      ) : (
        <div className="space-y-6">
          {previousByMonth.length === 0 ? (
            <div className="card p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {filter !== 'all' ? `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Bookings` : 'No bookings yet'}
              </h3>
              <p className="text-muted mb-4">
                {filter !== 'all' 
                  ? `You don't have any ${filter} bookings`
                  : 'Your booking history will appear here'}
              </p>
              {filter !== 'all' ? (
                <button
                  onClick={() => setFilter('all')}
                  className="btn btn-primary"
                >
                  View All History
                </button>
              ) : (
                <Link href="/bookings" className="btn btn-primary inline-flex">
                  Book Your First Slot
                </Link>
              )}
            </div>
          ) : (
            previousByMonth.map((group) => (
              <div key={group.key} className="space-y-3">
                {/* Month Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-1 bg-gradient-to-b from-primary-600 to-primary-700 rounded-full"></div>
                  <h2 className="section-title">{group.label}</h2>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="badge badge-gray">{group.items.length} booking{group.items.length !== 1 ? 's' : ''}</span>
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
                      <BookingCard 
                        key={b._id} 
                        booking={b} 
                        tag={tag} 
                        onCancel={handleCancelBooking}
                      />
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

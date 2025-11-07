import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import api from '../lib/api';
import BookingCard from '../components/BookingCard';
import BookingWizard from '../components/BookingWizard';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import PageHeader from '../components/common/PageHeader';

export default function BookingsPage() {
  return (
    <ProtectedRoute role="student">
      <Bookings />
    </ProtectedRoute>
  );
}

function Bookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'history' | 'cancelled'>('upcoming');
  const [toast, setToast] = useState('');

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

  useEffect(() => { fetchBookings(); }, []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const upcoming = useMemo(() =>
    (bookings || [])
      .filter((b) => b.date >= today)
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
  , [bookings, today]);
  const past = useMemo(() =>
    (bookings || [])
      .filter((b) => b.date < today && b.status !== 'Cancelled')
      .sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)))
  , [bookings, today]);
  const cancelled = useMemo(() => (bookings || []).filter((b)=> b.status === 'Cancelled'), [bookings]);
  const historyByMonth = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const b of past) {
      const d = new Date(b.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    }
    // sort keys desc
    const ordered = Object.keys(groups).sort((a,b)=> b.localeCompare(a));
    return ordered.map((k)=> ({ key: k, label: new Date(k+'-01T00:00:00').toLocaleString(undefined,{ month:'long', year:'numeric'}), items: groups[k] }));
  }, [past]);

  const handleCancel = async (id: string) => {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      setToast('❌ Booking cancelled successfully.');
      setTimeout(()=> setToast(''), 2000);
      await fetchBookings();
    } catch {}
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-blue-50 to-emerald-50">
      {toast && <div className="fixed right-4 top-20 z-50 rounded-lg bg-red-600 px-3 py-2 text-sm text-white shadow">{toast}</div>}
      <PageHeader title="Book Ground" subtitle="Request a slot and track your bookings" />
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <BookingWizard onSuccess={fetchBookings} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              className={`btn ${tab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab('upcoming')}
            >My Bookings</button>
            <button
              className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab('history')}
            >Booking History</button>
            {cancelled.length > 0 && (
              <button
                className={`btn ${tab === 'cancelled' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTab('cancelled')}
              >Cancelled Bookings</button>
            )}
          </div>

          {loading ? (
            <Loader className="py-6" />)
          : (
            <div className={`transition-opacity duration-300 ${tab === 'upcoming' ? 'opacity-100' : 'opacity-0 hidden'} space-y-3`}>
              <h2 className="text-xl font-semibold">Upcoming</h2>
              {upcoming.length === 0 ? (
                <EmptyState title="No upcoming bookings" subtitle="Your approved or pending bookings will appear here" />
              ) : (
                upcoming.map((b) => (
                  <BookingCard key={b._id} booking={b} onCancel={handleCancel} />
                ))
              )}
            </div>
          )}

          {!loading && (
            <div className={`transition-opacity duration-300 ${tab === 'history' ? 'opacity-100' : 'opacity-0 hidden'} space-y-4`}>
              <h2 className="text-xl font-semibold">History</h2>
              {historyByMonth.length === 0 ? (
                <EmptyState title="No past bookings" subtitle="Once a booking date passes, it will show here" />
              ) : (
                historyByMonth.map((group) => (
                  <div key={group.key} className="space-y-2">
                    <div className="mt-2 text-sm font-medium text-slate-700">{group.label}</div>
                    {group.items.map((b: any) => {
                      const tag = b.status === 'Approved' ? 'Completed' : 'Missed';
                      return (
                        <BookingCard key={b._id} booking={b} viewOnly tag={tag} showReceipt />
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          )}

          {!loading && (
            <div className={`transition-opacity duration-300 ${tab === 'cancelled' ? 'opacity-100' : 'opacity-0 hidden'} space-y-3`}>
              <h2 className="text-xl font-semibold">Cancelled Bookings</h2>
              {cancelled.length === 0 ? (
                <EmptyState title="No cancelled bookings" subtitle="Your cancelled bookings will appear here" />
              ) : (
                cancelled.map((b) => (
                  <BookingCard key={b._id} booking={b} viewOnly tag={b.canceledAt ? `Cancelled on ${new Date(b.canceledAt).toLocaleDateString()}` : 'Cancelled'} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

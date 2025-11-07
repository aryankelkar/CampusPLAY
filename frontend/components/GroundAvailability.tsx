import { useState } from 'react';
import api from '../lib/api';
import EmptyState from './common/EmptyState';
import PageHeader from './common/PageHeader';

const GROUNDS = ['Ground 1', 'Ground 2'];

export default function GroundAvailability() {
  const [ground, setGround] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<{ slot: string; status: 'Booked' | 'Vacant' | 'Pending'; bookedBy?: string | null; game?: string | null }[]>([]);
  const [error, setError] = useState('');

  const fetchAvailability = async () => {
    setError('');
    if (!ground || !date) {
      setError('Please select ground and date');
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get('/bookings/availability', { params: { ground, date } });
      setAvailability(data?.data?.slots || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white/90 backdrop-blur p-6 rounded-2xl shadow-xl">
      <PageHeader title="Ground Availability" subtitle="Check which time slots are booked or vacant for a given date" />
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <select value={ground} onChange={(e) => setGround(e.target.value)} className="input w-full md:w-auto h-11 text-base">
          <option value="">Select Ground</option>
          {GROUNDS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-full md:w-auto h-11 text-base" />
        <button onClick={fetchAvailability} disabled={loading} className="btn btn-primary disabled:opacity-60">
          {loading ? 'Loading...' : 'Check Availability'}
        </button>
      </div>

      {ground && date && (
        <div className="mb-3 text-sm text-gray-700">
          Checking availability for <b>{ground}</b> — <b>{new Date(date + 'T00:00:00').toDateString()}</b>
        </div>
      )}

      <div className="mb-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-3 rounded-full bg-green-500" /> Vacant</div>
        <div className="flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-3 rounded-full bg-yellow-500" /> Pending</div>
        <div className="flex items-center gap-2"><span aria-hidden className="inline-block h-3 w-3 rounded-full bg-red-500" /> Booked</div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-pulse">
          {Array.from({length:9}).map((_,i)=>(
            <div key={i} className="h-16 rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : availability.length === 0 ? (
        <EmptyState title="No bookings yet" subtitle="Lots of free slots today — go ahead and pick one!" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availability.map((slot, index) => {
            const color = slot.status === 'Booked' ? 'bg-red-100 text-red-800 border-red-200' : slot.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200';
            const pill = slot.status === 'Booked' ? '🔴 Booked' : slot.status === 'Pending' ? '🟡 Pending' : '🟢 Vacant';
            return (
              <div key={index} className={`rounded-xl border p-3 ${color}`}>
                <div className="font-semibold">{slot.slot}</div>
                <div className="text-xs mt-1 inline-flex rounded-full bg-white/60 px-2 py-0.5">{pill}</div>
                <div className="text-xs text-gray-600 mt-1">{slot.bookedBy || '-'} {slot.game ? `• ${slot.game}` : ''}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import api from '../lib/api';
import EmptyState from './common/EmptyState';
import { GROUNDS } from '../constants';

export default function GroundAvailability() {
  const [ground, setGround] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<{ slot: string; status: 'Booked' | 'Vacant'; bookedBy?: string | null; game?: string | null }[]>([]);
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
    <div className="max-w-4xl mx-auto mt-10 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 shadow-sm mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h1 className="page-title mb-2">Ground Availability</h1>
        <p className="text-muted">Check which time slots are booked or vacant</p>
      </div>
      <div className="card p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2 animate-fade-in">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1">
            <label className="label mb-2 block">🏟️ Ground</label>
            <select value={ground} onChange={(e) => setGround(e.target.value)} className="input">
              <option value="">Select Ground</option>
              {GROUNDS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="label mb-2 block">📅 Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <div className="flex items-end">
            <button onClick={fetchAvailability} disabled={loading} className="btn btn-primary px-6 py-3 w-full md:w-auto">
              {loading ? 'Loading...' : 'Check Availability'}
            </button>
          </div>
        </div>

        {ground && date && (
          <div className="mb-4 p-4 rounded-lg bg-primary-50 border border-primary-200 text-sm text-gray-700">
            🔍 Checking availability for <b className="text-primary-700">{ground}</b> on <b className="text-primary-700">{new Date(date + 'T00:00:00').toDateString()}</b>
          </div>
        )}

        <div className="mb-4 flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 text-secondary-700"><span aria-hidden className="inline-block h-3 w-3 rounded-full bg-secondary-500 shadow-sm" /> Vacant</div>
          <div className="flex items-center gap-2 text-red-700"><span aria-hidden className="inline-block h-3 w-3 rounded-full bg-red-500 shadow-sm" /> Booked (Approved)</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
            {Array.from({length:12}).map((_,i)=>(
              <div key={i} className="h-24 rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : availability.length === 0 ? (
          <EmptyState title="No bookings yet" subtitle="Lots of free slots today — go ahead and pick one!" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {availability.map((slot, index) => {
              const isBooked = slot.status === 'Booked';
              const color = isBooked ? 'bg-red-50 border-red-200' : 'bg-secondary-50 border-secondary-200';
              const textColor = isBooked ? 'text-red-800' : 'text-secondary-800';
              const pill = isBooked ? '🔴 Booked' : '🟢 Vacant';
              return (
                <div key={index} className={`card p-4 ${color} hover:shadow-md transition-all`}>
                  <div className={`font-bold text-lg ${textColor} mb-2`}>{slot.slot}</div>
                  <div className="text-xs font-semibold inline-flex rounded-full bg-white px-2.5 py-1 border border-gray-200 shadow-sm mb-2">{pill}</div>
                  {isBooked && (
                    <div className="text-xs text-gray-700 mt-2 pt-2 border-t border-red-200">
                      <div className="font-medium">{slot.bookedBy || 'Someone'}</div>
                      {slot.game && <div className="text-muted">{slot.game}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

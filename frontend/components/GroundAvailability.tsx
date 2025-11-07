import { useState } from 'react';
import api from '../lib/api';
import EmptyState from './common/EmptyState';
import PageHeader from './common/PageHeader';
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
    <div className="max-w-4xl mx-auto mt-10">
      <div className="text-center mb-8">
        <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-xl mb-4">
          <span className="text-4xl">📊</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Ground Availability</h1>
        <p className="text-gray-600">Check which time slots are booked or vacant</p>
      </div>
      <div className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-xl border border-gray-100">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2"><span>❌</span>{error}</div>}
        
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">🏟️ Ground</label>
            <select value={ground} onChange={(e) => setGround(e.target.value)} className="input w-full">
              <option value="">Select Ground</option>
              {GROUNDS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-full" />
          </div>
          <div className="flex items-end">
            <button onClick={fetchAvailability} disabled={loading} className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full md:w-auto">
              {loading ? 'Loading...' : 'Check Availability'}
            </button>
          </div>
        </div>

        {ground && date && (
          <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-gray-700">
            🔍 Checking availability for <b className="text-blue-700">{ground}</b> on <b className="text-blue-700">{new Date(date + 'T00:00:00').toDateString()}</b>
          </div>
        )}

        <div className="mb-4 flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 text-green-700"><span aria-hidden className="inline-block h-3 w-3 rounded-full bg-green-500 shadow-sm" /> Vacant</div>
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
              const color = isBooked ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200';
              const textColor = isBooked ? 'text-red-800' : 'text-green-800';
              const pill = isBooked ? '🔴 Booked' : '🟢 Vacant';
              return (
                <div key={index} className={`rounded-2xl border-2 p-4 ${color} hover:shadow-md transition-all`}>
                  <div className={`font-bold text-lg ${textColor} mb-2`}>{slot.slot}</div>
                  <div className="text-xs font-semibold inline-flex rounded-full bg-white/70 px-2.5 py-1 border border-white/50 shadow-sm mb-2">{pill}</div>
                  {isBooked && (
                    <div className="text-xs text-gray-700 mt-2 pt-2 border-t border-red-200">
                      <div className="font-medium">{slot.bookedBy || 'Someone'}</div>
                      {slot.game && <div className="text-gray-600">{slot.game}</div>}
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

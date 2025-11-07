import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../components/ProtectedRoute';
import BookingWizard from '../components/BookingWizard';

export default function BookingsPage() {
  return (
    <ProtectedRoute role="student">
      <Bookings />
    </ProtectedRoute>
  );
}

function Bookings() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBookingSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-[calc(100vh-120px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 shadow-xl mb-4">
          <span className="text-4xl">🏏</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Book a Ground</h1>
        <p className="text-gray-600">Reserve your spot and get ready to play</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-5 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎮</div>
            <div>
              <div className="text-sm font-medium text-blue-600">Step 1</div>
              <div className="text-xs text-blue-800">Choose sport & ground</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-5 border border-green-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📅</div>
            <div>
              <div className="text-sm font-medium text-green-600">Step 2</div>
              <div className="text-xs text-green-800">Pick date & time slot</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-3xl">👥</div>
            <div>
              <div className="text-sm font-medium text-purple-600">Step 3</div>
              <div className="text-xs text-purple-800">Add team members</div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Wizard */}
      <BookingWizard key={refreshKey} onSuccess={handleBookingSuccess} />

      {/* Quick Links */}
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Need to check your bookings?</h3>
            <p className="text-sm text-gray-600">View your booking status and history</p>
          </div>
          <Link 
            href="/history" 
            className="px-6 py-3 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 border border-indigo-200"
          >
            <span>📚</span> View History
          </Link>
        </div>
      </div>
    </div>
  );
}

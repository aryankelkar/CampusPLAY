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
    <div className="min-h-[calc(100vh-120px)] max-w-4xl mx-auto px-4 py-6 animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 shadow-sm mb-4">
          <span className="text-3xl">🏏</span>
        </div>
        <h1 className="page-title mb-2">Book a Ground</h1>
        <p className="text-muted">Reserve your spot and get ready to play</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-100 border border-primary-200 grid place-items-center text-2xl">🎮</div>
            <div>
              <div className="text-sm font-semibold text-primary-700">Step 1</div>
              <div className="text-xs text-muted">Choose sport & ground</div>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-secondary-50 border-secondary-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary-100 border border-secondary-200 grid place-items-center text-2xl">📅</div>
            <div>
              <div className="text-sm font-semibold text-secondary-700">Step 2</div>
              <div className="text-xs text-muted">Pick date & time slot</div>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-accent-50 border-accent-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent-100 border border-accent-200 grid place-items-center text-2xl">👥</div>
            <div>
              <div className="text-sm font-semibold text-accent-700">Step 3</div>
              <div className="text-xs text-muted">Add team members</div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Wizard */}
      <BookingWizard key={refreshKey} onSuccess={handleBookingSuccess} />

      {/* Quick Links */}
      <div className="mt-8 card p-6 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-primary mb-1">Need to check your bookings?</h3>
            <p className="text-sm text-muted">View your booking status and history</p>
          </div>
          <Link 
            href="/history" 
            className="btn btn-outline px-6 py-2.5 flex items-center gap-2"
          >
            <span>📚</span> <span>View History</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

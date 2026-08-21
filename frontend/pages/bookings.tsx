import { useState } from 'react';
import Link from 'next/link';
import { History, ArrowRight } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-64px)] bg-[#F3F7FC] text-[#0F172A] font-inter py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Compact Header */}
        <div className="mb-6 text-center max-w-xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-[11px] font-extrabold uppercase tracking-[0.08em] mb-1.5 border border-[#BFDBFE]">
            Ground Reservation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-1">
            Reserve Your Ground
          </h1>
          <p className="text-xs sm:text-sm text-[#52657A] font-normal leading-relaxed">
            Choose a sport, select a ground and time slot, then submit your reservation request.
          </p>
        </div>

        {/* Main Booking Workspace */}
        <div className="bg-white rounded-[22px] border border-[#E8EEF5] p-5 sm:p-7 mb-6 shadow-[6px_6px_18px_rgba(148,163,184,0.14),-6px_-6px_18px_rgba(255,255,255,0.9)]">
          <BookingWizard key={refreshKey} onSuccess={handleBookingSuccess} />
        </div>

        {/* Track Reservations Banner */}
        <div className="rounded-[18px] bg-white border border-[#E8EEF5] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_12px_rgba(148,163,184,0.10)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[12px] bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center flex-shrink-0 font-bold">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Track Your Reservations</h3>
              <p className="text-xs text-[#52657A]">Check active approvals, status, or squad details anytime.</p>
            </div>
          </div>
          <Link 
            href="/history" 
            className="btn btn-outline px-4 py-2.5 rounded-[10px] font-bold text-xs text-[#2563EB] border border-[#DCE6F0] hover:bg-[#EFF6FF] transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <span>View History</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
}

import { useState } from 'react';
import ConfirmModal from './common/ConfirmModal';
import { BOOKING_STATUS, BookingStatus } from '../constants';
import StatusTag from './common/StatusTag';
import { formatShortDate } from '../utils/helpers';
import { 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Mail, 
  Hash, 
  BookOpen, 
  Layers,
  MapPin,
  Trophy,
  ShieldCheck,
  Trash2,
  XCircle,
  AlertCircle
} from 'lucide-react';

type Booking = {
  _id: string;
  game: string;
  ground: string;
  date: string;
  time?: string;
  timeSlots?: string[];
  status: BookingStatus;
  name?: string;
  roll?: string;
  email?: string;
  branch?: string;
  division?: string;
  classYear?: string;
  teamMembers?: { name: string; roll: string; email: string }[];
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
};

export default function BookingCard({
  booking,
  onCancel,
  onDelete,
  viewOnly = false,
  tag,
}: {
  booking: Booking;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
  viewOnly?: boolean;
  tag?: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const displayTime = booking.timeSlots && booking.timeSlots.length > 0 
    ? booking.timeSlots.join(', ') 
    : booking.time || 'N/A';

  return (
    <>
      <div className="bg-white rounded-[18px] border border-[#E8EEF5] p-4 sm:p-5 shadow-xs hover:border-[#BFDBFE] hover:-translate-y-0.5 transition-all duration-200 font-inter">
        
        {/* Compact Card Row Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Left: Status + Sport */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <StatusTag status={booking.status} />
              {tag && (
                <span className="text-[10px] font-bold text-[#52657A] bg-[#F1F5F9] px-2 py-0.5 rounded-full border border-[#CBD5E1]">
                  {tag}
                </span>
              )}
            </div>

            <div className="text-base sm:text-lg font-extrabold text-[#0F172A] flex items-center gap-2">
              <Trophy size={16} className="text-[#2563EB]" />
              <span>{booking.game}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#52657A] mt-1 font-semibold">
              <span className="flex items-center gap-1 text-[#0F172A]">
                <MapPin size={13} className="text-[#2563EB]" />
                {booking.ground}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#0F172A]">
                <Calendar size={13} className="text-[#2563EB]" />
                {formatShortDate(booking.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#2563EB] font-bold">
                <Clock size={13} />
                {displayTime}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8EEF5]">
            {!viewOnly && onCancel && (booking.status === BOOKING_STATUS.PENDING || booking.status === BOOKING_STATUS.APPROVED) && (
              <button
                className="btn text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 text-xs font-bold rounded-[10px] transition-all"
                onClick={() => setConfirmOpen(true)}
              >
                Cancel Booking
              </button>
            )}
            {!viewOnly && onDelete && (booking.status === BOOKING_STATUS.REJECTED || booking.status === BOOKING_STATUS.CANCELLED) && (
              <button
                className="btn text-[#52657A] bg-[#F8FAFC] hover:bg-slate-100 border border-[#DCE6F0] px-3 py-1.5 text-xs font-bold rounded-[10px] flex items-center gap-1 transition-all"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
            <button 
              className="btn text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1 transition-all"
              onClick={() => setOpen((v) => !v)}
            >
              <span>{open ? 'Hide Details' : 'View Details'}</span>
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

        </div>

        {/* Expanded Details Panel */}
        {open && (
          <div className="mt-4 pt-4 border-t border-[#E8EEF5] space-y-4 animate-in fade-in duration-200">
            
            {/* Two Column Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F8FAFC] p-4 rounded-[14px] border border-[#E2E8F0]">
              
              {/* Left Column: Booking Specs */}
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase text-[#2563EB] tracking-wider border-b border-[#E2E8F0] pb-1">
                  Booking Details
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52657A]">Sport Discipline:</span>
                  <span className="font-extrabold text-[#0F172A]">{booking.game}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52657A]">Venue Facility:</span>
                  <span className="font-extrabold text-[#0F172A]">{booking.ground}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52657A]">Date:</span>
                  <span className="font-extrabold text-[#0F172A]">{booking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52657A]">Time Slot(s):</span>
                  <span className="font-extrabold text-[#2563EB]">{displayTime}</span>
                </div>
              </div>

              {/* Right Column: Student Details */}
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase text-[#2563EB] tracking-wider border-b border-[#E2E8F0] pb-1 flex items-center gap-1">
                  <ShieldCheck size={13} />
                  <span>Applicant Information</span>
                </div>
                {booking.name && (
                  <div className="flex justify-between">
                    <span className="text-[#52657A]">Student Name:</span>
                    <span className="font-bold text-[#0F172A]">{booking.name}</span>
                  </div>
                )}
                {booking.roll && (
                  <div className="flex justify-between">
                    <span className="text-[#52657A]">Roll Number:</span>
                    <span className="font-bold text-[#0F172A]">{booking.roll}</span>
                  </div>
                )}
                {booking.email && (
                  <div className="flex justify-between">
                    <span className="text-[#52657A]">Email:</span>
                    <span className="font-bold text-[#0F172A] truncate max-w-[180px]">{booking.email}</span>
                  </div>
                )}
                {(booking.branch || booking.division || booking.classYear) && (
                  <div className="flex justify-between">
                    <span className="text-[#52657A]">Class / Branch:</span>
                    <span className="font-bold text-[#0F172A]">
                      {[booking.branch, booking.division ? `Div ${booking.division}` : null, booking.classYear ? `Year ${booking.classYear}` : null].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Rejection Reason Box */}
            {booking.status === BOOKING_STATUS.REJECTED && booking.rejectionReason && (
              <div className="bg-rose-50 rounded-[14px] p-3.5 border border-rose-200 text-xs">
                <div className="font-extrabold text-rose-700 mb-1 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>Rejection Reason</span>
                </div>
                <p className="text-rose-900 leading-relaxed font-medium">{booking.rejectionReason}</p>
                {booking.rejectedBy && (
                  <div className="text-[10px] text-rose-700 mt-1.5">
                    Reviewed by: <span className="font-bold">{booking.rejectedBy}</span>
                  </div>
                )}
              </div>
            )}

            {/* Approval Info Box */}
            {booking.status === BOOKING_STATUS.APPROVED && booking.approvedBy && (
              <div className="bg-[#EFF6FF] rounded-[14px] p-3.5 border border-[#BFDBFE] text-xs">
                <div className="font-extrabold text-[#1D4ED8] mb-0.5">Approved Ground Reservation</div>
                <div className="text-[11px] text-[#52657A]">
                  Approved by Campus Admin: <span className="font-bold text-[#0F172A]">{booking.approvedBy}</span>
                </div>
              </div>
            )}

            {/* Squad / Teammate Roster */}
            {Array.isArray(booking.teamMembers) && booking.teamMembers.length > 0 && (
              <div className="space-y-2">
                <div className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider">
                  Squad Roster ({booking.teamMembers.length} teammates)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {booking.teamMembers.map((m, i) => (
                    <div key={i} className="bg-white rounded-[12px] p-3 text-xs border border-[#E8EEF5] shadow-xs">
                      <div className="font-bold text-[#0F172A]">{m.name || 'Teammate'}</div>
                      <div className="text-[11px] text-[#52657A] mt-0.5">{m.roll || '-'} • {m.email || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        open={confirmOpen}
        title={'CANCEL THIS BOOKING?'}
        description={
          <div className="text-xs space-y-2.5">
            <p className="text-[#52657A]">This action cannot be undone. Are you sure you want to cancel your ground reservation for:</p>
            <div className="bg-[#EFF6FF] rounded-[12px] p-3 space-y-1 text-left border border-[#BFDBFE]">
              <div className="font-extrabold text-[#0F172A]">{booking.game} at {booking.ground}</div>
              <div className="text-[#2563EB] font-bold text-[11px]">{booking.date} • {displayTime}</div>
            </div>
            <p className="text-rose-600 font-semibold">Once cancelled, this slot will immediately become available for other students.</p>
          </div>
        }
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); onCancel && onCancel(booking._id); }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        title={'DELETE BOOKING RECORD?'}
        description={
          <div className="text-xs space-y-2.5">
            <p className="text-[#52657A]">Are you sure you want to permanently delete this booking record?</p>
            <div className="bg-[#F8FAFC] rounded-[12px] p-3 space-y-1 text-left border border-[#E2E8F0]">
              <div className="font-bold text-[#0F172A]">{booking.game} at {booking.ground}</div>
              <div className="text-[#52657A] text-[11px]">{booking.date} • {displayTime}</div>
            </div>
            <p className="text-rose-600 font-semibold">This record will be permanently removed from your activity log.</p>
          </div>
        }
        confirmText="Delete Record"
        cancelText="Keep It"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => { setDeleteConfirmOpen(false); onDelete && onDelete(booking._id); }}
      />
    </>
  );
}

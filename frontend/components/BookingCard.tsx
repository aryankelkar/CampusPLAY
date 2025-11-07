import { useState } from 'react';
import ConfirmModal from './common/ConfirmModal';
import { BOOKING_STATUS, STATUS_ICONS, BookingStatus } from '../constants';
import { getStatusBadgeClass } from '../utils/helpers';

type Booking = {
  _id: string;
  game: string;
  ground: string;
  date: string;
  time: string;
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
  viewOnly = false,
  tag,
}: {
  booking: Booking;
  onCancel?: (id: string) => void;
  viewOnly?: boolean;
  tag?: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const badgeClass = getStatusBadgeClass(booking.status);
  const statusIcon = STATUS_ICONS[booking.status];
  return (
    <div className="group rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={badgeClass}>
              <span className="mr-1.5">{statusIcon}</span>
              <span className="font-medium">{booking.status}</span>
            </span>
            {tag && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{tag}</span>
            )}
          </div>
          <div className="text-xl font-bold text-slate-800 mb-1">{booking.game} @ {booking.ground}</div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {booking.date}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {booking.time}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {!viewOnly && onCancel && booking.status === BOOKING_STATUS.PENDING && (
            <button
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
              onClick={() => setConfirmOpen(true)}
            >Cancel</button>
          )}
          <button 
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '▲ Hide' : '▼ View'} Details
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-5 space-y-4 border-t border-gray-200 pt-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {booking.name && (
              <>
                <div className="text-gray-500 font-medium">Name</div>
                <div className="text-gray-900 font-semibold">{booking.name}</div>
              </>
            )}
            {booking.roll && (
              <>
                <div className="text-gray-500 font-medium">Roll</div>
                <div className="text-gray-900 font-semibold">{booking.roll}</div>
              </>
            )}
            {booking.email && (
              <>
                <div className="text-gray-500 font-medium">Email</div>
                <div className="text-gray-900 font-semibold text-xs">{booking.email}</div>
              </>
            )}
            {booking.branch && (
              <>
                <div className="text-gray-500 font-medium">Branch</div>
                <div className="text-gray-900 font-semibold">{booking.branch}</div>
              </>
            )}
            {booking.division && (
              <>
                <div className="text-gray-500 font-medium">Division</div>
                <div className="text-gray-900 font-semibold">{booking.division}</div>
              </>
            )}
            {booking.classYear && (
              <>
                <div className="text-gray-500 font-medium">Class</div>
                <div className="text-gray-900 font-semibold">{booking.classYear}</div>
              </>
            )}
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-blue-700">Booking Info</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="text-gray-500">Game:</span> {booking.game}</div>
              <div><span className="text-gray-500">Ground:</span> {booking.ground}</div>
              <div><span className="text-gray-500">Date:</span> {booking.date}</div>
              <div><span className="text-gray-500">Time:</span> {booking.time}</div>
              <div><span className="text-gray-500">Status:</span> <span className={badgeClass}><span className="mr-1">{statusIcon}</span>{booking.status}</span></div>
            </div>
          </div>

          {/* Rejection Reason - Display for rejected bookings */}
          {booking.status === BOOKING_STATUS.REJECTED && booking.rejectionReason && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border-l-4 border-red-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-red-800 mb-1 flex items-center gap-2">
                    <span>Rejection Reason</span>
                  </div>
                  <p className="text-sm text-red-700 leading-relaxed">{booking.rejectionReason}</p>
                  {booking.rejectedBy && (
                    <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <span>Rejected by:</span>
                      <span className="font-medium">{booking.rejectedBy}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Approval Info - Display for approved bookings */}
          {booking.status === BOOKING_STATUS.APPROVED && booking.approvedBy && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-l-4 border-green-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-green-800 mb-1">Approved</div>
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <span>Approved by:</span>
                    <span className="font-medium">{booking.approvedBy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {Array.isArray(booking.teamMembers) && booking.teamMembers.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Team Members ({booking.teamMembers.length})
              </div>
              <div className="space-y-2">
                {booking.teamMembers.map((m, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 text-sm border border-blue-100">
                    <div className="font-semibold text-gray-800">{m.name || '-'}</div>
                    <div className="text-xs text-gray-600 mt-1">{m.roll || '-'} • {m.email || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={'⚠️ Cancel Booking'}
        description={<div className="text-sm">Are you sure you want to cancel this booking? This action cannot be undone.</div>}
        confirmText="Yes, Cancel Booking"
        cancelText="No, Keep It"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); onCancel && onCancel(booking._id); }}
      />
    </div>
  );
}

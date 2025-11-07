import { useState } from 'react';
import ConfirmModal from './common/ConfirmModal';

type Booking = {
  _id: string;
  game: string;
  ground: string;
  date: string;
  time: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  name?: string;
  roll?: string;
  email?: string;
  branch?: string;
  division?: string;
  classYear?: string;
  teamMembers?: { name: string; roll: string; email: string }[];
};

export default function BookingCard({
  booking,
  onCancel,
  viewOnly = false,
  tag,
  showReceipt = false,
}: {
  booking: Booking;
  onCancel?: (id: string) => void;
  viewOnly?: boolean;
  tag?: string;
  showReceipt?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const badgeClass =
    booking.status === 'Approved' ? 'badge badge-green' : booking.status === 'Rejected' ? 'badge badge-red' : booking.status === 'Cancelled' ? 'badge' : 'badge badge-yellow';
  const statusIcon = booking.status === 'Approved' ? '✅' : booking.status === 'Rejected' ? '❌' : booking.status === 'Cancelled' ? '🚫' : '🕒';
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{booking.date} • {booking.time}</div>
          <div className="text-lg font-semibold">{booking.game} @ {booking.ground}</div>
          {tag && (
            <div className="mt-1 text-xs text-gray-500">{tag}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={badgeClass}><span className="mr-1">{statusIcon}</span>{booking.status}</span>
          {!viewOnly && onCancel && booking.status === 'Pending' && (
            <button
              className="rounded-md px-3 py-1 text-sm text-white"
              style={{ background: '#EF4444' }}
              onClick={() => setConfirmOpen(true)}
            >Cancel</button>
          )}
          <button className="btn btn-secondary" onClick={() => setOpen((v) => !v)}>{open ? 'Hide' : 'View'} Details</button>
        </div>
      </div>

      {open && (
        <div className="mt-4 border-t pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold text-blue-700">Your Details</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="text-gray-500">Name:</span> {booking.name}</div>
                <div><span className="text-gray-500">Roll No:</span> {booking.roll}</div>
                <div><span className="text-gray-500">Email:</span> {booking.email}</div>
                <div><span className="text-gray-500">Branch:</span> {booking.branch}</div>
                <div><span className="text-gray-500">Division:</span> {booking.division}</div>
                <div><span className="text-gray-500">Class Year:</span> {booking.classYear}</div>
              </div>
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
          </div>

          {Array.isArray(booking.teamMembers) && booking.teamMembers.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 font-semibold text-blue-700">Team Members</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-left text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Roll No</th>
                      <th className="p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.teamMembers.map((m, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{m.name}</td>
                        <td className="p-2">{m.roll}</td>
                        <td className="p-2">{m.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {viewOnly && showReceipt && (
              <button className="btn btn-secondary" onClick={() => alert('Receipt download is a mock in this build.')}>Download Receipt</button>
            )}
          </div>
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

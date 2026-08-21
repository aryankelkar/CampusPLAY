import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminBookingList from '../../components/AdminBookingList';

export default function PendingPage() {
  return (
    <ProtectedRoute role="admin">
      <div className="px-4 py-6">
        <AdminBookingList
          statusFilter="Pending"
          title="Admin • Pending Bookings"
          subtitle="Review requests and take action"
          emptyTitle="No pending bookings"
          emptySubtitle="New requests will appear here"
          showActions="pending"
        />
      </div>
    </ProtectedRoute>
  );
}

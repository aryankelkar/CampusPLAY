import ProtectedRoute from '../../components/ProtectedRoute';
import AdminBookingList from '../../components/AdminBookingList';

export default function ApprovedPage() {
  return (
    <ProtectedRoute role="admin">
      <div className="px-4 py-6">
        <AdminBookingList
          statusFilter="Approved"
          title="Admin • Approved Bookings"
          subtitle="Approved bookings overview"
          emptyTitle="No approved bookings"
          emptySubtitle="Approved bookings will appear here"
          showActions="approved"
        />
      </div>
    </ProtectedRoute>
  );
}

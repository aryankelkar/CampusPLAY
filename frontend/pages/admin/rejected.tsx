import ProtectedRoute from '../../components/ProtectedRoute';
import AdminBookingList from '../../components/AdminBookingList';

export default function RejectedPage() {
  return (
    <ProtectedRoute role="admin">
      <div className="px-4 py-6">
        <AdminBookingList
          statusFilter="Rejected"
          title="Admin • Rejected Bookings"
          subtitle="Rejected bookings overview"
          emptyTitle="No rejected bookings"
          emptySubtitle="Rejected bookings will appear here"
          showActions="rejected"
        />
      </div>
    </ProtectedRoute>
  );
}

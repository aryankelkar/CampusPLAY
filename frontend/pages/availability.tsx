import ProtectedRoute from '../components/ProtectedRoute';
import GroundAvailability from '../components/GroundAvailability';

export default function AvailabilityPage() {
  return (
    <ProtectedRoute>
      <div className="px-4 py-6">
        <GroundAvailability />
      </div>
    </ProtectedRoute>
  );
}

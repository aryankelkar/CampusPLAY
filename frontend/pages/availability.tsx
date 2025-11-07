import ProtectedRoute from '../components/ProtectedRoute';
import GroundAvailability from '../components/GroundAvailability';

export default function AvailabilityPage() {
  return (
    <ProtectedRoute>
      <div className="px-4">
        <GroundAvailability />
      </div>
    </ProtectedRoute>
  );
}

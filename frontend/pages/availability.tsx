import ProtectedRoute from '../components/ProtectedRoute';
import GroundAvailability from '../components/GroundAvailability';

export default function AvailabilityPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-64px)] bg-[#F3F7FC] text-[#0F172A] font-inter py-6 sm:py-8">
        <GroundAvailability />
      </div>
    </ProtectedRoute>
  );
}

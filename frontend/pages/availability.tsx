import Head from 'next/head';
import ProtectedRoute from '../components/ProtectedRoute';
import GroundAvailability from '../components/GroundAvailability';

export default function AvailabilityPage() {
  return (
    <>
      <Head>
        <title>Ground Availability — CampusPlay</title>
        <meta name="description" content="Check real-time availability of campus sports grounds and indoor courts." />
      </Head>
      <ProtectedRoute>
        <div className="w-full">
          <GroundAvailability />
        </div>
      </ProtectedRoute>
    </>
  );
}

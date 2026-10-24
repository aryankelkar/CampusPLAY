import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function RejectedPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard?status=rejected');
  }, [router]);

  return (
    <ProtectedRoute role="admin">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-[#52657A] font-semibold">Redirecting to Dashboard...</div>
      </div>
    </ProtectedRoute>
  );
}

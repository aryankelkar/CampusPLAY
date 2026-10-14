import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from './common/Loader';

export default function ProtectedRoute({ children, role }: { children: JSX.Element; role?: 'admin' | 'student' }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthorized = !loading && user && (!role || user.role === role);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (role && user.role !== role) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/');
    }
  }, [user, loading, role, router]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  return children;
}

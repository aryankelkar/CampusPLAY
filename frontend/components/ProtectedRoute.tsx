import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import Loader from './common/Loader';

export default function ProtectedRoute({ children, role }: { children: JSX.Element; role?: 'admin' | 'student' }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const me = data?.data?.user;
        if (!role || me?.role === role) {
          setAllowed(true);
        } else {
          router.replace('/');
        }
      } catch {
        router.replace('/login');
      }
    };
    check();
  }, [router, role]);

  if (!allowed) return (
    <div className="flex items-center justify-center py-20">
      <Loader />
    </div>
  );
  return children;
}

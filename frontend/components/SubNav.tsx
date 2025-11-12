import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function SubNav() {
  const { user } = useAuth();
  const router = useRouter();
  const linkCls = (href: string) =>
    `rounded-full px-3 py-1 text-sm transition-colors ${router.pathname === href ? 'bg-gradient-sport text-white' : 'bg-white/70 text-gray-800 hover:bg-white'}`;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <Link className={linkCls('/')} href="/">Home</Link>
      <Link className={linkCls('/bookings')} href="/bookings">Book Ground</Link>
      <Link className={linkCls('/availability')} href="/availability">Availability</Link>
      {user?.role === 'admin' && (
        <Link className={linkCls('/admin/dashboard')} href="/admin/dashboard">Admin</Link>
      )}
    </div>
  );
}

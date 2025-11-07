import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function BookRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/bookings'); }, [router]);
  return null;
}

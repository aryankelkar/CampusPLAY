import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const u = data?.data?.user || null; setUser(u);
        if (u?.role === 'student') {
          const { data: b } = await api.get('/bookings');
          setBookings(b?.data?.bookings || []);
        }
      } catch {}
    };
    load();
  }, []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const upcoming3 = useMemo(() =>
    (bookings||[])
      .filter((b:any)=> b.date >= today)
      .sort((a:any,b:any)=> (a.date===b.date? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
      .slice(0,3)
  ,[bookings,today]);

  const tagCls = (s:string) => s==='Approved'? 'bg-green-100 text-green-700' : s==='Rejected'? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-10">
      {/* Hero */}
      <section
        className="hero"
        style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          background:'linear-gradient(90deg,#DBF4FF,#ECFDF5)',borderRadius:16 as any,padding:'3rem 2rem',
          boxShadow:'0 4px 16px rgba(0,0,0,0.05)'
        }}
      >
        <div className="max-w-xl">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-800">Welcome to CampusPlay 🎾</h1>
          <p className="mt-3 text-slate-600">Book your favorite sports ground, manage approvals, and start playing — all in one place.</p>
          <div className="mt-6 flex gap-3">
            {user?.role === 'admin' ? (
              <>
                <Link href="/admin/dashboard" className="hero-btn primary" style={{borderRadius:8 as any,padding:'10px 24px',fontWeight:600,background:'#3B82F6',color:'#fff'}}>Go to Dashboard</Link>
                <Link href="/availability" className="hero-btn" style={{borderRadius:8 as any,padding:'10px 24px',fontWeight:600,border:'1px solid #3B82F6',color:'#1E40AF'}}>Availability</Link>
              </>
            ) : (
              <>
                <Link href="/bookings" className="hero-btn primary" style={{borderRadius:8 as any,padding:'10px 24px',fontWeight:600,background:'#3B82F6',color:'#fff'}}>Book Ground</Link>
                <Link href={user?'/bookings':'/login'} className="hero-btn" style={{borderRadius:8 as any,padding:'10px 24px',fontWeight:600,border:'1px solid #3B82F6',color:'#1E40AF'}}>View My Bookings</Link>
              </>
            )}
          </div>
        </div>
        <div className="hidden md:block">
          <div className="h-40 w-56 rounded-xl bg-white/70 shadow grid place-items-center">🏏🧑‍🎓</div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[{icon:'👤',title:'Login/Register',text:'Use your @vit.edu.in email'}, {icon:'🏏',title:'Book Ground',text:'Pick sport, ground, date & time'}, {icon:'✅',title:'Play',text:'Get approval and enjoy!'}].map((c,i)=> (
            <div key={i} className="rounded-xl bg-white p-5 shadow transition hover:shadow-md">
              <div className="text-3xl">{c.icon}</div>
              <div className="mt-2 font-medium">{c.title}</div>
              <div className="text-sm text-slate-600">{c.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking summary for students */}
      {user?.role==='student' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-800">Your upcoming</h2>
            <Link href="/bookings" className="text-blue-700 hover:underline">View all →</Link>
          </div>
          {upcoming3.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-slate-600 shadow">No upcoming bookings yet.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {upcoming3.map((b:any)=> (
                <div key={b._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow">
                  <div className="text-sm text-gray-500">{b.date} • {b.time}</div>
                  <div className="font-semibold">{b.game} @ {b.ground}</div>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${tagCls(b.status)}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

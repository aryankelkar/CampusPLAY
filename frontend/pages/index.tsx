import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { BOOKING_STATUS, STATUS_COLORS, USER_ROLES } from '../constants';
import { getTodayDate, getStatusBadgeClass } from '../utils/helpers';

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

  const today = useMemo(() => getTodayDate(), []);
  const upcoming3 = useMemo(() =>
    (bookings||[])
      .filter((b:any)=> b.date >= today)
      .sort((a:any,b:any)=> (a.date===b.date? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
      .slice(0,3)
  ,[bookings,today]);


  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-10">
      {/* Hero */}
      <section className="hero flex items-center justify-between rounded-3xl p-12 shadow-xl border border-white/50 backdrop-blur" style={{ background: 'linear-gradient(135deg, #DBF4FF 0%, #ECFDF5 50%, #E0F2FE 100%)' }}>
        <div className="max-w-xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
            ✨ Your Campus Sports Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 leading-tight">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">CampusPlay</span> 🎾
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">Simplifying Campus Sports Access — Book your favorite sports ground and start playing with ease.</p>
          <div className="mt-8 flex gap-4">
            {user?.role === USER_ROLES.ADMIN ? (
              <>
                <Link href="/admin/dashboard" className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all">Go to Dashboard</Link>
                <Link href="/availability" className="px-8 py-3 rounded-xl font-semibold border-2 border-blue-500 text-blue-700 bg-white hover:bg-blue-50 transition-all">Availability</Link>
              </>
            ) : (
              <>
                <Link href="/bookings" className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all">Book Ground</Link>
                <Link href={user ? '/bookings' : '/login'} className="px-8 py-3 rounded-xl font-semibold border-2 border-blue-500 text-blue-700 bg-white hover:bg-blue-50 transition-all">View My Bookings</Link>
              </>
            )}
          </div>
        </div>
        <div className="hidden md:block">
          <div className="h-48 w-64 rounded-2xl bg-gradient-to-br from-white to-blue-50 shadow-xl border border-white/50 grid place-items-center text-6xl backdrop-blur">
            🏏🧑‍🎓
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">How it works</h2>
          <p className="text-gray-600">Three simple steps to get you on the field</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: '👤', title: 'Login/Register', text: 'Use your @vit.edu.in email', color: 'from-blue-500 to-blue-600' },
            { icon: '🏏', title: 'Book Ground', text: 'Pick sport, ground, date & time', color: 'from-green-500 to-green-600' },
            { icon: '✅', title: 'Play', text: 'Get approval and enjoy!', color: 'from-purple-500 to-purple-600' }
          ].map((step, i) => (
            <div key={i} className="group rounded-2xl bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-1">
              <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${step.color} grid place-items-center text-3xl mb-4 shadow-lg`}>
                {step.icon}
              </div>
              <div className="text-lg font-bold text-slate-800 mb-2">{step.title}</div>
              <div className="text-sm text-gray-600 leading-relaxed">{step.text}</div>
              <div className="mt-4 text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Step {i + 1} →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking summary for students */}
      {user?.role === USER_ROLES.STUDENT && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Your upcoming</h2>
              <p className="text-gray-600 text-sm mt-1">Quick view of your next bookings</p>
            </div>
            <Link href="/bookings" className="px-4 py-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium transition-colors">View all →</Link>
          </div>
          {upcoming3.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">🏀</div>
              <div className="text-gray-600 font-medium">No upcoming bookings yet</div>
              <div className="text-sm text-gray-500 mt-1">Start by booking a ground!</div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {upcoming3.map((b: any) => (
                <div key={b._id} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[b.status as keyof typeof STATUS_COLORS]?.badge || 'bg-gray-100 text-gray-700'}`}>{b.status}</span>
                  </div>
                  <div className="font-bold text-lg text-slate-800 mb-2">{b.game}</div>
                  <div className="text-sm text-gray-600 mb-1">🏟️ {b.ground}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-3 pt-3 border-t">
                    <span>📅 {b.date}</span>
                    <span>•</span>
                    <span>🕒 {b.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

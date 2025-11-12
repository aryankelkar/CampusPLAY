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
    <div className="w-full">
      {/* 🖼️ Hero Section with Background */}
      <section 
        className="relative min-h-[600px] flex items-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(37, 99, 235, 0.25)), linear-gradient(180deg, #F0FDF4, #DBEAFE)',
        }}
      >
        {/* Image Placeholder - Replace with: /images/hero/hero-sports-campus.jpg */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-primary-200 via-accent-200 to-secondary-200 flex items-center justify-center">
            <p className="text-9xl">🏟️</p>
          </div>
        </div>
        {/* AI Prompt: Bright modern university sports field at sunset, students playing football and badminton, green turf, trees, modern campus buildings, soft golden light */}
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="badge badge-blue inline-flex items-center gap-2 mb-6">
                <span>🎯</span>
                <span>Your Campus Sports Hub</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                Book. Play. Compete.{' '}
                <span className="text-gradient-sport">🌿</span>
              </h1>
              <p className="text-xl text-muted leading-relaxed mb-8">
                Simplifying campus sports access — book your favorite sports ground and start playing with ease.
              </p>
              <div className="flex flex-wrap gap-4">
                {user?.role === USER_ROLES.ADMIN ? (
                  <>
                    <Link href="/admin/dashboard" className="btn btn-primary px-8 py-4 text-lg">Go to Dashboard</Link>
                    <Link href="/availability" className="btn btn-outline px-8 py-4 text-lg">View Availability</Link>
                  </>
                ) : (
                  <>
                    <Link href="/bookings" className="btn btn-primary px-8 py-4 text-lg">Book Ground Now</Link>
                    <Link href={user ? '/bookings' : '/login'} className="btn btn-outline px-8 py-4 text-lg">My Bookings</Link>
                  </>
                )}
              </div>
            </div>
            
            {/* Hero Image Placeholder */}
            <div className="hidden md:block animate-fade-in">
              <div className="card p-8 h-96 flex items-center justify-center shadow-sport-hover">
                <div className="text-center">
                  <p className="text-8xl mb-4">⚽🏏🏀</p>
                  <p className="text-muted text-sm">Sports ground illustration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 space-y-16">

      {/* 🏅 Highlights Section */}
      <section className="bg-gradient-to-b from-white to-primary-50 -mx-4 px-4 py-16 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="section-title mb-4">Why Choose CampusPlay?</h2>
          <p className="text-muted text-lg">Everything you need for seamless sports booking</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '⏱️', title: 'Book in Seconds', desc: 'Reserve your favorite ground instantly' },
            { icon: '📊', title: 'Track History', desc: 'View all your past and upcoming bookings' },
            { icon: '✅', title: 'Instant Approvals', desc: 'Get notified when admin approves' },
            { icon: '👥', title: 'Team Play', desc: 'Organize matches with your squad' },
          ].map((item, i) => (
            <div key={i} className="card-interactive p-6 text-center group animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">{item.icon}</div>
              <h3 className="font-bold text-lg mb-2 text-primary-950">{item.title}</h3>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="text-center mb-10">
          <h2 className="section-title mb-2">How it works</h2>
          <p className="text-muted">Three simple steps to get you on the field</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: '👤', title: 'Login/Register', text: 'Use your @vit.edu.in email', color: 'blue' },
            { icon: '🏏', title: 'Book Ground', text: 'Pick sport, ground, date & time', color: 'green' },
            { icon: '✅', title: 'Play', text: 'Get approval and enjoy!', color: 'yellow' }
          ].map((step, i) => (
            <div key={i} className="card-interactive p-6 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`h-12 w-12 rounded-lg grid place-items-center text-2xl mb-4 badge badge-${step.color}`}>
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{color: '#14532D'}}>{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Booking summary for students */}
      {user?.role === USER_ROLES.STUDENT && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="section-title">Your Upcoming Bookings</h2>
              <p className="text-muted text-sm mt-1">Quick view of your next reservations</p>
            </div>
            <Link href="/history" className="btn btn-ghost">View all →</Link>
          </div>
          {upcoming3.length === 0 ? (
            <div className="card p-10 text-center border-2 border-dashed border-gray-300">
              <div className="text-5xl mb-3">🏀</div>
              <h3 className="font-semibold mb-1" style={{color: '#14532D'}}>No upcoming bookings yet</h3>
              <p className="text-sm text-muted">Start by booking a ground!</p>
              <Link href="/bookings" className="btn btn-primary mt-4 inline-flex">Book Now</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {upcoming3.map((b: any) => (
                <div key={b._id} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge ${STATUS_COLORS[b.status as keyof typeof STATUS_COLORS]?.badge || 'badge-gray'}`}>{b.status}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{color: '#14532D'}}>{b.game}</h3>
                  <p className="text-sm text-muted mb-1">🏟️ {b.ground}</p>
                  <div className="text-xs text-muted flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
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

      {/* 🌿 Community CTA Section */}
      {!user && (
        <section 
          className="relative -mx-4 px-6 py-16 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(37, 99, 235, 0.15))',
          }}
        >
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-950">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted mb-8">
              Join hundreds of students already using CampusPlay to book and manage their sports activities.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register" className="btn btn-primary px-8 py-4 text-lg">
                Create Account
              </Link>
              <Link href="/about" className="btn btn-outline px-8 py-4 text-lg">
                Learn More
              </Link>
            </div>
          </div>
        </section>
      )}

      </div>
    </div>
  );
}

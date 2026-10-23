import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { 
  Clock, 
  CalendarCheck, 
  History as HistoryIcon,
  ArrowRight, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Trophy,
  MapPin
} from 'lucide-react';
import api from '../lib/api';
import { USER_ROLES } from '../constants';
import { getTodayDate, formatShortDate, getDisplayTime } from '../utils/helpers';
import StatusTag from '../components/common/StatusTag';
import SportsImageCard from '../components/common/SportsImageCard';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: authData } = await api.get('/api/auth/me');
        const u = authData?.data?.user || null; 
        setUser(u);
        
        try {
          const { data: bData } = await api.get('/api/bookings');
          setBookings(bData?.data?.bookings || []);
        } catch {}
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = useMemo(() => getTodayDate(), []);
  
  // Dynamic upcoming bookings derived strictly from backend data
  const upcomingBookings = useMemo(() =>
    (bookings || [])
      .filter((b: any) => b.date >= today)
      .sort((a: any, b: any) => {
        const aTime = a.timeSlots && a.timeSlots[0] ? a.timeSlots[0] : a.time || '';
        const bTime = b.timeSlots && b.timeSlots[0] ? b.timeSlots[0] : b.time || '';
        return a.date === b.date ? aTime.localeCompare(bTime) : a.date.localeCompare(b.date);
      })
  , [bookings, today]);

  // Derived real statistics calculated strictly from application state
  const totalBookingsCount = bookings.length;
  const pendingBookingsCount = bookings.filter((b: any) => (b.status || '').toLowerCase() === 'pending').length;
  const approvedBookingsCount = bookings.filter((b: any) => (b.status || '').toLowerCase() === 'approved').length;
  const upcomingBookingsCount = upcomingBookings.length;

  return (
    <div className="w-full min-h-screen bg-transparent text-[#0F172A] pb-12">
      
      {/* SECTION 1: HERO SECTION (VIEWPORT-FIRST UX) */}
      <section className="relative pt-4 sm:pt-6 lg:pt-8 pb-6 sm:pb-8 lg:pb-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Column: Eyebrow, Heading, Description & CTAs (50% desktop split) */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-bold tracking-[0.08em] uppercase mb-3 border border-[#BFDBFE] w-fit shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                <span>Campus Sports Platform</span>
              </div>
              
              {/* Heading */}
              <h1 className="text-[clamp(2.5rem,5vw,4.25rem)] font-extrabold text-[#0F172A] tracking-tight leading-[0.98] mb-4">
                BOOK.<br />
                PLAY.<br />
                <span className="text-[#2563EB]">COMPETE.</span>
              </h1>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-[#52657A] leading-relaxed mb-6 max-w-[540px] font-normal">
                Reserve campus sports grounds, check availability, and manage your bookings in real-time with verified university authentication.
              </p>
              
              {/* Primary & Secondary CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                {user?.role === USER_ROLES.ADMIN ? (
                  <>
                    <Link 
                      href="/admin/dashboard" 
                      className="btn btn-primary px-5 py-3 rounded-[12px] font-bold text-sm flex items-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    >
                      <span className="text-white">Admin Dashboard</span>
                      <ArrowRight size={18} className="text-white" />
                    </Link>
                    <Link 
                      href="/availability" 
                      className="btn btn-outline px-5 py-3 rounded-[12px] font-semibold text-sm bg-white text-[#1D4ED8] border border-[#DCE6F0] hover:bg-[#EFF6FF] hover:-translate-y-0.5 transition-all duration-200"
                    >
                      Check Availability
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/bookings" 
                      className="btn btn-primary px-5 py-3 rounded-[12px] font-bold text-sm flex items-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    >
                      <span className="text-white">Book a Ground</span>
                      <ArrowRight size={18} className="text-white" />
                    </Link>
                    <Link 
                      href="/availability" 
                      className="btn btn-outline px-5 py-3 rounded-[12px] font-semibold text-sm bg-white text-[#1D4ED8] border border-[#DCE6F0] hover:bg-[#EFF6FF] hover:-translate-y-0.5 transition-all duration-200"
                    >
                      Check Availability
                    </Link>
                  </>
                )}
              </div>

            </div>
            
            {/* Right Column: Authentic Campus Grounds Photograph (Bigger & Clean) */}
            <div className="lg:col-span-6 relative mt-4 lg:mt-0">
              <div className="relative rounded-[24px] overflow-hidden border border-[#E8EEF5] bg-white shadow-[8px_8px_22px_rgba(148,163,184,0.18),-8px_-8px_22px_rgba(255,255,255,0.95)] group">
                <div className="relative h-[280px] sm:h-[380px] lg:h-[430px] xl:h-[460px] w-full overflow-hidden">
                  <Image 
                    src="/images/campus-grounds.jpg" 
                    alt="Vidyalankar Campus Sports Grounds & Main Building" 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 650px"
                    className="object-cover object-[center_60%] group-hover:scale-[1.015] transition-transform duration-300 ease-out motion-reduce:group-hover:scale-100"
                    priority
                  />
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 2: QUICK ACTIONS ROW */}
      <section className="py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Action 1: Book a Ground */}
            <Link 
              href="/bookings"
              className="p-4 sm:p-5 rounded-[18px] bg-white border border-[#E8EEF5] shadow-[4px_4px_12px_rgba(148,163,184,0.12),-4px_-4px_12px_rgba(255,255,255,0.85)] hover:-translate-y-1 hover:border-[#2563EB]/40 transition-all duration-200 flex items-center gap-4 group"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                <CalendarCheck size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">Book a Ground</h3>
                  <ChevronRight size={16} className="text-[#8897A8] group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
                <p className="text-xs text-[#52657A] truncate">Select sport, venue & reserve slot</p>
              </div>
            </Link>

            {/* Action 2: Check Availability */}
            <Link 
              href="/availability"
              className="p-4 sm:p-5 rounded-[18px] bg-white border border-[#E8EEF5] shadow-[4px_4px_12px_rgba(148,163,184,0.12),-4px_-4px_12px_rgba(255,255,255,0.85)] hover:-translate-y-1 hover:border-[#2563EB]/40 transition-all duration-200 flex items-center gap-4 group"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                <Clock size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">Check Availability</h3>
                  <ChevronRight size={16} className="text-[#8897A8] group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
                <p className="text-xs text-[#52657A] truncate">View open slots across grounds</p>
              </div>
            </Link>

            {/* Action 3: View My Bookings */}
            <Link 
              href="/history" 
              className="p-4 sm:p-5 rounded-[18px] bg-white border border-[#E8EEF5] shadow-[4px_4px_12px_rgba(148,163,184,0.12),-4px_-4px_12px_rgba(255,255,255,0.85)] hover:-translate-y-1 hover:border-[#2563EB]/40 transition-all duration-200 flex items-center gap-4 group"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                <HistoryIcon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">View My Bookings</h3>
                  <ChevronRight size={16} className="text-[#8897A8] group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
                <p className="text-xs text-[#52657A] truncate">Track active & pending requests</p>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* SECTION 3: SPORTS DISCOVERY (BASKETBALL & VOLLEYBALL) */}
      <section className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2563EB] bg-[#DBEAFE] px-2.5 py-0.5 rounded-md border border-[#BFDBFE] inline-block mb-1.5">
                Sports Discovery
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                Featured Campus Courts & Sports
              </h2>
              <p className="text-xs sm:text-sm text-[#52657A] mt-1 max-w-xl">
                Explore dedicated campus courts, coordinate pickup games with classmates, and check live slot availability.
              </p>
            </div>
            
            <Link 
              href="/availability" 
              className="btn btn-outline px-4 py-2.5 rounded-[12px] text-xs font-bold text-[#2563EB] bg-white border border-[#DCE6F0] hover:bg-[#EFF6FF] transition-all flex items-center gap-1.5 w-fit flex-shrink-0"
            >
              <span>View All Facilities</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SportsImageCard 
              src="/images/campus-basketball.jpg"
              alt="Students playing basketball on campus outdoor court"
              title="Basketball"
              category="CAMPUS COURT"
              badge="Outdoor Hardcourt"
              description="Find a court, organize your next pickup game, and reserve an available time slot."
              href="/availability"
              ctaText="Check Court Availability"
              aspectRatio="4/3"
              objectPosition="center 40%"
            />

            <SportsImageCard 
              src="/images/campus-volleyball.jpg"
              alt="Students competing in campus volleyball match"
              title="Volleyball"
              category="CAMPUS SPORTS"
              badge="Regulation Net"
              description="Discover outdoor volleyball facilities and coordinate your next campus match."
              href="/availability"
              ctaText="Check Court Availability"
              aspectRatio="4/3"
              objectPosition="center 30%"
            />
          </div>
        </div>
      </section>

      {/* SECTION 4: CAMPUS FACILITIES — AERIAL SPORTS GROUND */}
      <section className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[24px] overflow-hidden border border-[#E8EEF5] bg-white shadow-[6px_6px_20px_rgba(148,163,184,0.14),-6px_-6px_20px_rgba(255,255,255,0.9)] group">
            
            {/* Aerial Image Container */}
            <div className="relative h-[300px] sm:h-[380px] lg:h-[420px] w-full overflow-hidden bg-slate-900">
              <Image 
                src="/images/campus-aerial-ground.jpg" 
                alt="High-angle aerial view of campus sports playing field" 
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500 ease-out motion-reduce:group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/40 to-transparent pointer-events-none" />

              {/* Floating Top Badge */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#2563EB] text-[11px] font-extrabold tracking-wider uppercase border border-white/50 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                  CAMPUS SPORTS SPACES
                </span>
              </div>

              {/* Bottom Editorial Content Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-8 lg:p-10 text-white z-20 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="max-w-2xl">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase leading-tight mb-2 sm:mb-3 drop-shadow-sm">
                    Room to Play. Space to Compete.
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl font-normal drop-shadow-xs">
                    From competitive university tournaments to casual evening football and cricket matches, our expansive multi-sport field gives every student the space to stay active, build teams, and compete.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link 
                    href="/availability" 
                    className="btn btn-primary px-5 py-3 rounded-[12px] font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-white shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <span>Check Ground Slots</span>
                    <ArrowRight size={15} />
                  </Link>
                  <Link 
                    href="/bookings" 
                    className="btn btn-outline px-5 py-3 rounded-[12px] font-bold text-xs uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#0F172A] border border-white/50 hover:bg-white hover:-translate-y-0.5 transition-all"
                  >
                    <span>Reserve Ground</span>
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: STATISTICS (COMPACT & REAL DATA ONLY) */}
      {totalBookingsCount > 0 && (
        <section className="py-4 sm:py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              
              <div className="p-4 rounded-[16px] bg-white border border-[#E8EEF5] shadow-[3px_3px_10px_rgba(148,163,184,0.10)] flex flex-col justify-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {totalBookingsCount}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#52657A] mt-1">
                  Total Bookings
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-white border border-[#E8EEF5] shadow-[3px_3px_10px_rgba(148,163,184,0.10)] flex flex-col justify-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#10B981] tracking-tight">
                  {approvedBookingsCount}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#52657A] mt-1">
                  Approved Slots
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-white border border-[#E8EEF5] shadow-[3px_3px_10px_rgba(148,163,184,0.10)] flex flex-col justify-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#F59E0B] tracking-tight">
                  {pendingBookingsCount}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#52657A] mt-1">
                  Pending Review
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-white border border-[#E8EEF5] shadow-[3px_3px_10px_rgba(148,163,184,0.10)] flex flex-col justify-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#2563EB] tracking-tight">
                  {upcomingBookingsCount}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#52657A] mt-1">
                  Upcoming Slots
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* SECTION 6: UPCOMING BOOKINGS (STUDENT PERSONAL ACTIVITY ONLY) */}
      {user && user.role !== USER_ROLES.ADMIN && (
        <section className="py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2563EB] bg-[#DBEAFE] px-2.5 py-0.5 rounded-md border border-[#BFDBFE] inline-block mb-1">
                  Personal Activity
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  Your Upcoming Bookings
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <Link 
                  href="/history" 
                  className="btn btn-outline px-3.5 py-2 rounded-[10px] text-xs font-bold text-[#2563EB] bg-white border border-[#DCE6F0] hover:bg-[#EFF6FF] transition-all flex items-center gap-1"
                >
                  <span>View Full History</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Dynamic Real Upcoming Bookings Cards */}
            {upcomingBookings.length === 0 ? (
              <div className="p-6 sm:p-8 text-center bg-white rounded-[20px] border border-[#E8EEF5] shadow-[4px_4px_14px_rgba(148,163,184,0.12),-4px_-4px_14px_rgba(255,255,255,0.85)] max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
                  <Trophy size={24} />
                </div>
                <h3 className="font-bold text-base text-[#0F172A] mb-1">No Upcoming Bookings</h3>
                <p className="text-xs text-[#52657A] mb-4">You haven't reserved a campus sports slot yet.</p>
                <Link 
                  href="/bookings" 
                  className="btn btn-primary px-5 py-2.5 rounded-[12px] text-xs font-bold inline-flex items-center gap-2 shadow-sm"
                >
                  <span className="text-white">Book a Ground</span>
                  <ArrowRight size={14} className="text-white" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {upcomingBookings.map((b: any, idx: number) => {
                  const displayTime = getDisplayTime(b);
                  const formattedDate = formatShortDate(b.date);
                  return (
                    <div 
                      key={b._id || idx} 
                      className="p-4 rounded-[16px] bg-white border border-[#E8EEF5] shadow-[3px_3px_10px_rgba(148,163,184,0.10)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#2563EB]/30 transition-all"
                    >
                      {/* Left: Sport & Ground */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-[12px] bg-[#2563EB] text-white font-extrabold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-[#0F172A] tracking-tight">{b.game}</h4>
                          <p className="text-xs font-semibold text-[#52657A]">{b.ground}</p>
                        </div>
                      </div>

                      {/* Middle: Date & Time */}
                      <div className="flex items-center gap-4 sm:gap-8">
                        <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 tabular-nums">
                          <Calendar size={14} className="text-[#2563EB]" />
                          <span>{formattedDate}</span>
                        </div>

                        <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 tabular-nums">
                          <Clock size={14} className="text-[#2563EB]" />
                          <span>{displayTime}</span>
                        </div>

                        {/* Right: Status & Action */}
                        <StatusTag status={b.status} />

                        <Link 
                          href="/history" 
                          className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline hidden sm:inline-flex items-center gap-1 ml-2"
                        >
                          <span>View Details</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </section>
      )}

      {/* SECTION 7: HOW CAMPUSPLAY WORKS */}
      <section className="py-8 sm:py-12 bg-white/60 border-t border-[#E8EEF5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-lg mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#DBEAFE] px-2.5 py-0.5 rounded-md border border-[#BFDBFE] inline-block mb-1.5">
              Connected Process
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              How CampusPLAY Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {[
              { 
                step: '01', 
                title: 'AUTHENTICATE', 
                desc: 'Sign in with your verified campus email (@vit.edu.in).',
                icon: ShieldCheck
              },
              { 
                step: '02', 
                title: 'SELECT SLOT', 
                desc: 'Choose your desired sport, ground venue, date, and available time.',
                icon: CalendarCheck
              },
              { 
                step: '03', 
                title: 'PLAY & COMPETE', 
                desc: 'Receive your reservation confirmation and access the campus ground.',
                icon: Trophy
              },
            ].map((s, idx) => {
              const IconComp = s.icon;
              return (
                <div 
                  key={idx} 
                  className="p-5 sm:p-6 rounded-[20px] bg-white border border-[#E8EEF5] shadow-[4px_4px_12px_rgba(148,163,184,0.12),-4px_-4px_12px_rgba(255,255,255,0.85)] hover:-translate-y-1 transition-all duration-200 relative z-10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-extrabold font-mono text-[#2563EB]">{s.step}</span>
                    <div className="w-9 h-9 rounded-[10px] bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
                      <IconComp size={18} />
                    </div>
                  </div>
                  <h3 className="text-sm font-extrabold text-[#0F172A] tracking-tight mb-1">{s.title}</h3>
                  <p className="text-xs text-[#52657A] leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

    </div>
  );
}

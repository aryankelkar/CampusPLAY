import Link from 'next/link';
import { 
  Trophy, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CalendarCheck, 
  Dumbbell, 
  ArrowRight,
  Sparkles,
  Activity
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-white/80 backdrop-blur-md text-[#52657A] border-t border-[#DCE6F0] pt-14 pb-8 font-sans overflow-hidden">
      {/* Subtle Atmospheric Top Glow */}
      <div 
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/30 to-transparent pointer-events-none" 
        aria-hidden="true"
      />
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[150px] bg-[#2563EB]/5 blur-[80px] pointer-events-none" 
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* TOP BRAND & STATUS BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-8 border-b border-[#E8EEF5] gap-6">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-xs">
                <Trophy size={16} className="text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A] uppercase font-sans">
                Campus<span className="text-[#2563EB]">Play</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-[#52657A] leading-relaxed font-normal">
              Digital athletic infrastructure for university sports grounds, court scheduling, and equipment checkout.
            </p>
          </div>

          {/* Operational Status Badge & Quick CTA */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-xs font-bold text-[#15803D] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>All Facilities Operational</span>
            </div>

            <Link 
              href="/availability"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold tracking-wide transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Check Open Slots</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* 4-COLUMN ORGANIZED FOOTER DIRECTORY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
          
          {/* Column 1: Sports Facilities */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A] mb-4 flex items-center gap-1.5">
              <MapPin size={14} className="text-[#2563EB]" />
              <span>Campus Facilities</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-[#52657A]">
              <li>
                <Link href="/availability" className="hover:text-[#2563EB] hover:underline transition-colors block font-medium">
                  Ground 1 (Football & Turf)
                </Link>
              </li>
              <li>
                <Link href="/availability" className="hover:text-[#2563EB] hover:underline transition-colors block font-medium">
                  Ground 2 (Cricket & Multi-Sport)
                </Link>
              </li>
              <li>
                <Link href="/availability" className="hover:text-[#2563EB] hover:underline transition-colors block font-medium">
                  Basketball Court (Outdoor)
                </Link>
              </li>
              <li>
                <Link href="/availability" className="hover:text-[#2563EB] hover:underline transition-colors block font-medium">
                  Badminton Court (Indoor Arena)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Student Services */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A] mb-4 flex items-center gap-1.5">
              <CalendarCheck size={14} className="text-[#2563EB]" />
              <span>Platform Services</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-[#52657A]">
              <li>
                <Link href="/bookings" className="hover:text-[#2563EB] hover:underline transition-colors block font-medium">
                  Reserve a Ground
                </Link>
              </li>
              <li>
                <Link href="/availability" className="hover:text-[#2563EB] hover:underline transition-colors block font-medium">
                  Slot Availability Matrix
                </Link>
              </li>
              <li>
                <Link href="/equipment" className="hover:text-[#2563EB] hover:underline transition-colors block font-medium">
                  Sports Equipment Catalog
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-[#2563EB] hover:underline transition-colors block font-medium">
                  Reservation Status & Squads
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Policy & Timetables */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A] mb-4 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#2563EB]" />
              <span>University Rules</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-[#52657A]">
              <li>
                <span className="block text-[#0F172A] font-bold">Verified Email Access</span>
                <span className="text-[11px] text-[#64748B]">Requires @vit.edu.in authentication</span>
              </li>
              <li>
                <span className="block text-[#0F172A] font-bold">Timetable Conflict Check</span>
                <span className="text-[11px] text-[#64748B]">Zero academic lecture overlap</span>
              </li>
              <li>
                <span className="block text-[#0F172A] font-bold">Equipment Return Window</span>
                <span className="text-[11px] text-[#64748B]">Check-in at sports department</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional Identity */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F172A] mb-4 flex items-center gap-1.5">
              <Trophy size={14} className="text-[#2563EB]" />
              <span>Athletics Council</span>
            </h4>
            <p className="text-xs text-[#52657A] leading-relaxed mb-3">
              Department of Physical Education & Sports Activities, Vidyalankar Campus, Mumbai.
            </p>
            <div className="pt-2">
              <Link 
                href="/about" 
                className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline inline-flex items-center gap-1 transition-colors"
              >
                <span>About the Project & Team</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

        </div>

        {/* BOTTOM METRIC & COPYRIGHT BAR */}
        <div className="pt-6 border-t border-[#E8EEF5] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span>© {currentYear} CampusPlay.</span>
            <span>•</span>
            <span>Engineered for Vidyalankar Sports Community.</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-semibold text-[#64748B]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              Socket.io Live Sync
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              Atomic Concurrency Protected
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}

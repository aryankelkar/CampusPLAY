import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-white/90 backdrop-blur-md text-[#52657A] border-t border-[#DCE6F0] py-6 sm:py-7 font-sans overflow-hidden">
      {/* Atmospheric Top Seam Glow */}
      <div 
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/40 to-transparent pointer-events-none" 
        aria-hidden="true"
      />

      {/* Subtle Athletic Jersey Perforated Mesh Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.22) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          
          {/* LEFT: COPYRIGHT & ATTRIBUTION */}
          <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
            <span>© {currentYear} Vidyalankar Sports Community</span>
          </div>

          {/* CENTER: COMPACT DIRECTORY LINKS */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs font-bold text-[#52657A]">
            <Link href="/availability" className="hover:text-[#2563EB] transition-colors">
              Facilities
            </Link>
            <Link href="/equipment" className="hover:text-[#2563EB] transition-colors">
              Equipment
            </Link>
            <Link href="/bookings" className="hover:text-[#2563EB] transition-colors">
              Bookings
            </Link>
            <Link href="/about" className="hover:text-[#2563EB] transition-colors">
              About
            </Link>
          </nav>

          {/* RIGHT: LIVE SYSTEM STATUS BADGES */}
          <div className="flex items-center gap-3 text-[11px] font-semibold text-[#64748B]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Operational
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              Socket.io Live
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white border-t border-[#1E293B] py-10 font-jakarta">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-white uppercase">CampusPlay</span>
            <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
            <span className="text-xs text-[#94A3B8] font-medium ml-2">University Sports Platform</span>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/bookings" className="hover:text-white transition-colors">Book Ground</Link>
            <Link href="/availability" className="hover:text-white transition-colors">Availability</Link>
            <Link href="/history" className="hover:text-white transition-colors">History</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </div>

          {/* Right: Copyright */}
          <div className="text-xs text-[#64748B] font-medium">
            © {new Date().getFullYear()} CampusPlay. Designed for University Sports.
          </div>

        </div>
      </div>
    </footer>
  );
}


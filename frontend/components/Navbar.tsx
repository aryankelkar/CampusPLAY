import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { 
  Home as HomeIcon, 
  CalendarCheck, 
  Clock, 
  Settings as SettingsIcon, 
  LogIn, 
  UserPlus, 
  LogOut, 
  ShieldCheck, 
  History, 
  Info,
  ChevronDown,
  Menu,
  X,
  Dumbbell,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CampusPlayLogo from './CampusPlayLogo';

export default function Navbar() {
  const router = useRouter();
  const { user, loading, logout: authLogout } = useAuth();
  const [logoError, setLogoError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setDropdown(false);
    setMobileOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    const handleRouteChange = () => {
      setDropdown(false);
      setMobileOpen(false);
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut: Escape to close dropdown or mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdown(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Body scroll lock when mobile navigation is open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (mobileOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'unset';
      }
    };
  }, [mobileOpen]);

  const handleNavClick = () => {
    setMobileOpen(false);
    setDropdown(false);
  };

  const avatar = useMemo(() => (user?.name ? user.name.charAt(0).toUpperCase() : 'U'), [user?.name]);

  const logout = async () => {
    try {
      await authLogout();
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('campusplay_token');
    }
    router.replace('/login');
  };

  // Active state helper
  const isActive = (path: string) => {
    if (path === '/') return router.pathname === '/';
    return router.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-[12px] z-[1000] w-full px-3 sm:px-6 mb-2 sm:mb-3 font-jakarta transition-all duration-200">
      <div 
        className={`relative mx-auto max-w-[1536px] h-[70px] sm:h-[76px] lg:h-[80px] px-3.5 sm:px-6 flex items-center justify-between transition-all duration-300 rounded-[20px] backdrop-blur-md backdrop-saturate-150 ${
          scrolled 
            ? 'bg-white/95 border border-[#CBD5E1]/90 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.12),0_20px_40px_-15px_rgba(37,99,235,0.08),inset_0_1px_1px_rgba(255,255,255,1)]'
            : 'bg-white/85 border border-white/80 ring-1 ring-slate-900/5 shadow-[0_8px_25px_-5px_rgba(15,23,42,0.08),0_15px_30px_-10px_rgba(37,99,235,0.05),inset_0_1px_2px_rgba(255,255,255,0.95)]'
        }`}
      >
        {/* Top Specular Sheen Line */}
        <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none rounded-t-[20px]" />
        
        {/* Subtle Athletic Accent Underline */}
        <div className="absolute bottom-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#2563EB]/20 to-transparent pointer-events-none" />

        {/* LEFT: OFFICIAL CAMPUSPLAY BRAND LOGO (PROMINENT & BOLD) */}
        <div className="flex items-center flex-shrink-0 py-1">
          <CampusPlayLogo 
            variant="full" 
            priority={true}
            onClick={handleNavClick}
            className="w-[170px] sm:w-[210px] md:w-[255px] lg:w-[290px] xl:w-[315px]"
            imgClassName="hover:opacity-90 transition-opacity"
          />
        </div>

        {/* CENTER: DESKTOP SEGMENTED DOCK */}
        <nav className="hidden md:flex items-center p-1 bg-[#F1F5F9]/70 backdrop-blur-xs rounded-[16px] border border-[#E2E8F0]/80 shadow-[inset_0_1px_2px_rgba(148,163,184,0.12)]" aria-label="Main Navigation">
          {/* HOME */}
          <Link 
            href="/"
            onClick={handleNavClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all duration-200 ${
              isActive('/') 
                ? 'bg-white text-[#2563EB] border border-[#BFDBFE] shadow-[0_2px_6px_rgba(37,99,235,0.12),inset_0_1px_1px_rgba(255,255,255,1)] font-extrabold scale-[1.02]'
                : 'text-[#52657A] hover:bg-white/60 hover:text-[#0F172A] hover:-translate-y-[0.5px]'
            }`}
          >
            <HomeIcon size={15} strokeWidth={isActive('/') ? 2.4 : 2} className={isActive('/') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
            <span>Home</span>
          </Link>

          {/* BOOK (Non-admin) */}
          {user?.role !== 'admin' && (
            <Link 
              href="/bookings"
              onClick={handleNavClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all duration-200 ${
                isActive('/bookings') 
                  ? 'bg-white text-[#2563EB] border border-[#BFDBFE] shadow-[0_2px_6px_rgba(37,99,235,0.12),inset_0_1px_1px_rgba(255,255,255,1)] font-extrabold scale-[1.02]'
                  : 'text-[#52657A] hover:bg-white/60 hover:text-[#0F172A] hover:-translate-y-[0.5px]'
              }`}
            >
              <CalendarCheck size={15} strokeWidth={isActive('/bookings') ? 2.4 : 2} className={isActive('/bookings') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
              <span>Book</span>
            </Link>
          )}

          {/* EQUIPMENT */}
          <Link 
            href="/equipment"
            onClick={handleNavClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all duration-200 ${
              isActive('/equipment') 
                ? 'bg-white text-[#2563EB] border border-[#BFDBFE] shadow-[0_2px_6px_rgba(37,99,235,0.12),inset_0_1px_1px_rgba(255,255,255,1)] font-extrabold scale-[1.02]'
                : 'text-[#52657A] hover:bg-white/60 hover:text-[#0F172A] hover:-translate-y-[0.5px]'
            }`}
          >
            <Dumbbell size={15} strokeWidth={isActive('/equipment') ? 2.4 : 2} className={isActive('/equipment') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
            <span>Equipment</span>
          </Link>

          {/* AVAILABILITY */}
          <Link 
            href="/availability"
            onClick={handleNavClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all duration-200 ${
              isActive('/availability') 
                ? 'bg-white text-[#2563EB] border border-[#BFDBFE] shadow-[0_2px_6px_rgba(37,99,235,0.12),inset_0_1px_1px_rgba(255,255,255,1)] font-extrabold scale-[1.02]'
                : 'text-[#52657A] hover:bg-white/60 hover:text-[#0F172A] hover:-translate-y-[0.5px]'
            }`}
          >
            <Clock size={15} strokeWidth={isActive('/availability') ? 2.4 : 2} className={isActive('/availability') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
            <span>Availability</span>
          </Link>

          {/* ABOUT */}
          <Link 
            href="/about"
            onClick={handleNavClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all duration-200 ${
              isActive('/about') 
                ? 'bg-white text-[#2563EB] border border-[#BFDBFE] shadow-[0_2px_6px_rgba(37,99,235,0.12),inset_0_1px_1px_rgba(255,255,255,1)] font-extrabold scale-[1.02]'
                : 'text-[#52657A] hover:bg-white/60 hover:text-[#0F172A] hover:-translate-y-[0.5px]'
            }`}
          >
            <Info size={15} strokeWidth={isActive('/about') ? 2.4 : 2} className={isActive('/about') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
            <span>About</span>
          </Link>

          {/* HISTORY (Non-admin) */}
          {user?.role !== 'admin' && (
            <Link 
              href="/history"
              onClick={handleNavClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all duration-200 ${
                isActive('/history') 
                  ? 'bg-white text-[#2563EB] border border-[#BFDBFE] shadow-[0_2px_6px_rgba(37,99,235,0.12),inset_0_1px_1px_rgba(255,255,255,1)] font-extrabold scale-[1.02]'
                  : 'text-[#52657A] hover:bg-white/60 hover:text-[#0F172A] hover:-translate-y-[0.5px]'
              }`}
            >
              <History size={15} strokeWidth={isActive('/history') ? 2.4 : 2} className={isActive('/history') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
              <span>History</span>
            </Link>
          )}

          {/* ADMIN (Admin only) */}
          {user?.role === 'admin' && (
            <Link 
              href="/admin/dashboard"
              onClick={handleNavClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all duration-200 ${
                isActive('/admin') 
                  ? 'bg-white text-[#2563EB] border border-[#BFDBFE] shadow-[0_2px_6px_rgba(37,99,235,0.12),inset_0_1px_1px_rgba(255,255,255,1)] font-extrabold scale-[1.02]'
                  : 'text-[#52657A] hover:bg-white/60 hover:text-[#0F172A] hover:-translate-y-[0.5px]'
              }`}
            >
              <ShieldCheck size={15} strokeWidth={isActive('/admin') ? 2.4 : 2} className={isActive('/admin') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* RIGHT: SETTINGS + PROFILE / USER CONTROL */}
        <div className="hidden md:flex items-center gap-2.5 relative">
          {!loading && (
            !user ? (
              <div className="flex items-center gap-2">
                <Link 
                  href="/login"
                  onClick={handleNavClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-bold text-[#52657A] hover:text-[#2563EB] hover:bg-white/70 border border-transparent hover:border-[#DCE6F0] transition-all duration-200"
                >
                  <LogIn size={16} strokeWidth={2} />
                  <span>Login</span>
                </Link>
                <Link 
                  href="/register"
                  onClick={handleNavClick}
                  className="btn btn-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded-[12px] shadow-[0_2px_8px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  <UserPlus size={16} strokeWidth={2} />
                  <span>Register</span>
                </Link>
              </div>
            ) : (
              <div className="relative flex items-center gap-2">
                {/* COMPACT SETTINGS ICON BUTTON */}
                <Link
                  href="/settings"
                  onClick={handleNavClick}
                  className="w-9 h-9 rounded-[12px] bg-white/70 border border-[#DCE6F0]/80 shadow-xs flex items-center justify-center text-[#52657A] hover:text-[#2563EB] hover:bg-white hover:border-[#BFDBFE] transition-all duration-200"
                  title="Settings"
                  aria-label="Settings"
                >
                  <SettingsIcon size={17} />
                </Link>

                {/* PROFILE BUTTON: [ Avatar ] User Name ▾ */}
                <button
                  onClick={() => setDropdown((v) => !v)}
                  aria-expanded={dropdown}
                  aria-haspopup="true"
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-[12px] bg-white/80 border border-[#DCE6F0] shadow-[0_2px_6px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)] hover:bg-white hover:border-[#BFDBFE] hover:shadow-[0_4px_12px_rgba(37,99,235,0.1)] transition-all duration-200 text-xs font-bold text-[#0F172A]"
                  title={`Account options for ${user?.name || 'User'}`}
                >
                  <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white font-black text-xs flex items-center justify-center shadow-xs ring-1 ring-white">
                    {avatar}
                  </div>
                  <span className="font-extrabold max-w-[110px] truncate text-[#0F172A]">
                    {user?.name ? user.name.split(' ')[0] : 'User'}
                  </span>
                  {user?.role === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE]">
                      Admin
                    </span>
                  )}
                  <ChevronDown size={14} className={`text-[#52657A] transition-transform duration-200 ${dropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* REDESIGNED FROSTED DROPDOWN PANEL */}
                {dropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdown(false)}
                    />
                    <div className="absolute right-0 top-12 w-64 p-2 z-50 rounded-[18px] bg-white/95 backdrop-blur-md border border-[#DCE6F0] shadow-[0_12px_32px_-4px_rgba(15,23,42,0.14),0_4px_12px_rgba(37,99,235,0.06),inset_0_1px_1px_rgba(255,255,255,1)] animate-fade-in">
                      {/* USER INFO HEADER */}
                      <div className="px-3.5 py-3 mb-1.5 rounded-[12px] bg-gradient-to-br from-[#F0F6FC] to-[#EDF4FB] border border-[#DCE6F0]">
                        <p className="text-sm font-bold text-[#0F172A] truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-[#52657A] truncate mt-0.5">{user?.email || ''}</p>
                        <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#DBEAFE] text-[#1D4ED8] mt-2 border border-[#BFDBFE]">
                          {user?.role || 'student'}
                        </span>
                      </div>

                      {/* DROPDOWN ITEMS */}
                      <Link 
                        href="/settings" 
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors" 
                        onClick={() => { handleNavClick(); }}
                      >
                        <SettingsIcon size={18} strokeWidth={2} /> 
                        <span>Profile & Settings</span>
                      </Link>

                      {user?.role !== 'admin' ? (
                        <Link 
                          href="/history" 
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors" 
                          onClick={() => { handleNavClick(); }}
                        >
                          <History size={18} strokeWidth={2} /> 
                          <span>My Booking History</span>
                        </Link>
                      ) : (
                        <Link 
                          href="/admin/dashboard" 
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors" 
                          onClick={() => { handleNavClick(); }}
                        >
                          <ShieldCheck size={18} strokeWidth={2} /> 
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <div className="my-1.5 border-t border-[#DCE6F0]"></div>

                      {/* LOGOUT BUTTON */}
                      <button 
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-left text-[#EF4444] font-semibold text-sm hover:bg-rose-50/80 transition-colors" 
                        onClick={() => { setDropdown(false); logout(); }}
                      >
                        <LogOut size={18} strokeWidth={2} className="text-[#EF4444]" /> 
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          )}
        </div>

        {/* MOBILE: HAMBURGER CONTROL */}
        <div className="flex items-center gap-2 md:hidden">
          {!loading && user && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center shadow-xs ring-1 ring-white">
              {avatar}
            </div>
          )}
          <button 
            aria-label="Toggle navigation menu" 
            aria-expanded={mobileOpen}
            className="p-2 rounded-[12px] bg-white/80 border border-[#DCE6F0] text-[#0F172A] shadow-xs active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#2563EB]" 
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} className="text-[#2563EB]" /> : <Menu size={20} className="text-[#0F172A]" />}
          </button>
        </div>
      </div>

      {/* MOBILE NEUMORPHIC MENU PANEL */}
      {mobileOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 md:hidden animate-fade-in" 
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden absolute left-4 right-4 top-20 z-50 p-4 rounded-[16px] bg-white border border-[#DCE6F0] shadow-[7px_7px_18px_rgba(148,163,184,0.18),-7px_-7px_18px_rgba(255,255,255,0.9)] animate-fade-in max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E2E8F0] px-1">
                <CampusPlayLogo variant="full" className="w-[145px]" onClick={handleNavClick} />
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E0EDFF] text-[#1D4ED8] border border-[#BFDBFE]">
                  Athletics
                </span>
              </div>
              {user && (
                <div className="px-4 py-3 rounded-[12px] bg-[#EDF4FB] border border-[#DCE6F0] mb-2">
                  <p className="text-sm font-bold text-[#0F172A]">{user?.name || 'User'}</p>
                  <p className="text-xs text-[#52657A] mt-0.5">{user?.email || ''}</p>
                </div>
              )}

              {/* MOBILE HOME */}
              <Link 
                href="/" 
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] min-h-[44px] text-sm font-semibold transition-all ${
                  isActive('/') 
                    ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 font-bold shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16)]' 
                    : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                }`}
              >
                <HomeIcon size={20} strokeWidth={2} /> 
                <span>Home</span>
              </Link>

              {/* MOBILE BOOK */}
              {user?.role !== 'admin' && (
                <Link 
                  href="/bookings" 
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[12px] min-h-[44px] text-sm font-semibold transition-all ${
                    isActive('/bookings') 
                      ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 font-bold shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16)]' 
                      : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                  }`}
                >
                  <CalendarCheck size={20} strokeWidth={2} /> 
                  <span>Book</span>
                </Link>
              )}

              {/* MOBILE EQUIPMENT */}
              <Link 
                href="/equipment" 
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] min-h-[44px] text-sm font-semibold transition-all ${
                  isActive('/equipment') 
                    ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 font-bold shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16)]' 
                    : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                }`}
              >
                <Dumbbell size={20} strokeWidth={2} /> 
                <span>Equipment</span>
              </Link>

              {/* MOBILE HISTORY */}
              {user?.role !== 'admin' && (
                <Link 
                  href="/history" 
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[12px] min-h-[44px] text-sm font-semibold transition-all ${
                    isActive('/history') 
                      ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 font-bold shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16)]' 
                      : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                  }`}
                >
                  <History size={20} strokeWidth={2} /> 
                  <span>History</span>
                </Link>
              )}

              {/* MOBILE AVAILABILITY */}
              <Link 
                href="/availability" 
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] min-h-[44px] text-sm font-semibold transition-all ${
                  isActive('/availability') 
                    ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 font-bold shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16)]' 
                    : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                }`}
              >
                <Clock size={20} strokeWidth={2} /> 
                <span>Availability</span>
              </Link>

              {/* MOBILE ABOUT */}
              <Link 
                href="/about" 
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] min-h-[44px] text-sm font-semibold transition-all ${
                  isActive('/about') 
                    ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 font-bold shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16)]' 
                    : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                }`}
              >
                <Info size={20} strokeWidth={2} /> 
                <span>About</span>
              </Link>

              {/* MOBILE ADMIN */}
              {user?.role === 'admin' && (
                <Link 
                  href="/admin/dashboard" 
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[12px] min-h-[44px] text-sm font-semibold transition-all ${
                    isActive('/admin') 
                      ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 font-bold shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16)]' 
                      : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                }`}
                >
                  <ShieldCheck size={20} strokeWidth={2} /> 
                  <span>Admin</span>
                </Link>
              )}

              {/* AUTH / SETTINGS */}
              {!loading && (!user ? (
                <>
                  <div className="my-2 border-t border-[#DCE6F0]"></div>
                  <Link 
                    href="/login" 
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-[12px] min-h-[44px] text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] font-semibold text-sm transition-colors" 
                  >
                    <LogIn size={20} strokeWidth={2} /> 
                    <span>Login</span>
                  </Link>
                  <Link 
                    href="/register" 
                    onClick={handleNavClick}
                    className="btn btn-primary px-4 py-3 min-h-[44px] text-sm font-bold flex items-center justify-center gap-2" 
                  >
                    <UserPlus size={20} strokeWidth={2} /> 
                    <span>Register</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="my-2 border-t border-[#DCE6F0]"></div>
                  <Link 
                    href="/settings" 
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-[12px] min-h-[44px] text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] font-semibold text-sm transition-colors" 
                  >
                    <SettingsIcon size={20} strokeWidth={2} /> 
                    <span>Settings</span>
                  </Link>
                  <button 
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-[12px] min-h-[44px] text-left text-[#EF4444] hover:bg-rose-50/80 font-semibold text-sm transition-colors" 
                  >
                    <LogOut size={20} strokeWidth={2} className="text-[#EF4444]" /> 
                    <span>Logout</span>
                  </button>
                </>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}



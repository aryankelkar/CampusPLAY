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
  Dumbbell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    <header className="sticky top-[12px] z-[1000] w-full px-3 sm:px-6 font-jakarta transition-all duration-200">
      <div 
        className={`mx-auto max-w-[1450px] h-[60px] sm:h-[66px] px-4 sm:px-6 flex items-center justify-between transition-all duration-200 border rounded-[18px] bg-white border-[#DCE6F0] ${
          scrolled 
            ? 'shadow-[7px_7px_18px_rgba(148,163,184,0.22),-7px_-7px_18px_rgba(255,255,255,0.95)] border-[#CBD5E1]'
            : 'shadow-[7px_7px_18px_rgba(148,163,184,0.16),-7px_-7px_18px_rgba(255,255,255,0.90)]'
        }`}
      >
        {/* LEFT: CAMPUSPLAY BRAND TEXT */}
        <Link 
          href="/" 
          className="flex items-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-xl p-1" 
          title="CampusPlay Home"
          onClick={handleNavClick}
        >
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#0F172A] uppercase">
            CampusPlay
          </span>
          <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
        </Link>

        {/* CENTER: DESKTOP NAVIGATION ITEMS */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5" aria-label="Main Navigation">
          {/* HOME */}
          <Link 
            href="/"
            onClick={handleNavClick}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-sm font-semibold transition-all duration-200 ${
              isActive('/') 
                ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] font-bold'
                : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)]'
            }`}
          >
            <HomeIcon size={18} strokeWidth={isActive('/') ? 2.3 : 2} className={isActive('/') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
            <span>Home</span>
          </Link>

          {/* BOOK (Non-admin) */}
          {user?.role !== 'admin' && (
            <Link 
              href="/bookings"
              onClick={handleNavClick}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-sm font-semibold transition-all duration-200 ${
                isActive('/bookings') 
                  ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] font-bold'
                  : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)]'
              }`}
            >
              <CalendarCheck size={18} strokeWidth={isActive('/bookings') ? 2.3 : 2} className={isActive('/bookings') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
              <span>Book</span>
            </Link>
          )}

          {/* EQUIPMENT */}
          <Link 
            href="/equipment"
            onClick={handleNavClick}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-sm font-semibold transition-all duration-200 ${
              isActive('/equipment') 
                ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] font-bold'
                : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)]'
            }`}
          >
            <Dumbbell size={18} strokeWidth={isActive('/equipment') ? 2.3 : 2} className={isActive('/equipment') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
            <span>Equipment</span>
          </Link>

          {/* HISTORY (Non-admin) */}
          {user?.role !== 'admin' && (
            <Link 
              href="/history"
              onClick={handleNavClick}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-sm font-semibold transition-all duration-200 ${
                isActive('/history') 
                  ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] font-bold'
                  : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)]'
              }`}
            >
              <History size={18} strokeWidth={isActive('/history') ? 2.3 : 2} className={isActive('/history') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
              <span>History</span>
            </Link>
          )}

          {/* AVAILABILITY */}
          <Link 
            href="/availability"
            onClick={handleNavClick}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-sm font-semibold transition-all duration-200 ${
              isActive('/availability') 
                ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] font-bold'
                : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)]'
            }`}
          >
            <Clock size={18} strokeWidth={isActive('/availability') ? 2.3 : 2} className={isActive('/availability') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
            <span>Availability</span>
          </Link>

          {/* ABOUT */}
          <Link 
            href="/about"
            onClick={handleNavClick}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-sm font-semibold transition-all duration-200 ${
              isActive('/about') 
                ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] font-bold'
                : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)]'
            }`}
          >
            <Info size={18} strokeWidth={isActive('/about') ? 2.3 : 2} className={isActive('/about') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
            <span>About</span>
          </Link>

          {/* ADMIN (Admin only) */}
          {user?.role === 'admin' && (
            <Link 
              href="/admin/dashboard"
              onClick={handleNavClick}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-sm font-semibold transition-all duration-200 ${
                isActive('/admin') 
                  ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD]/60 shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] font-bold'
                  : 'text-[#52657A] hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.85)]'
              }`}
            >
              <ShieldCheck size={18} strokeWidth={isActive('/admin') ? 2.3 : 2} className={isActive('/admin') ? 'text-[#2563EB]' : 'text-[#52657A]'} />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* RIGHT: SETTINGS + PROFILE / USER CONTROL */}
        <div className="hidden md:flex items-center gap-3 relative">
          {!loading && (
            !user ? (
              <div className="flex items-center gap-2">
                <Link 
                  href="/login"
                  onClick={handleNavClick}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-sm font-semibold text-[#52657A] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <LogIn size={18} strokeWidth={2} />
                  <span>Login</span>
                </Link>
                <Link 
                  href="/register"
                  onClick={handleNavClick}
                  className="btn btn-primary px-4 py-2 text-sm font-bold flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <UserPlus size={18} strokeWidth={2} />
                  <span>Register</span>
                </Link>
              </div>
            ) : (
              <div className="relative flex items-center gap-2.5">
                {/* COMPACT SETTINGS ICON BUTTON */}
                <Link
                  href="/settings"
                  onClick={handleNavClick}
                  className="p-2 rounded-[12px] text-[#52657A] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  title="Settings"
                  aria-label="Settings"
                >
                  <SettingsIcon size={18} />
                </Link>

                {/* PROFILE BUTTON: [ Avatar ] User Name ▾ */}
                <button
                  onClick={() => setDropdown((v) => !v)}
                  aria-expanded={dropdown}
                  aria-haspopup="true"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-[12px] bg-[#F8FAFC] border border-[#DCE6F0] shadow-[4px_4px_10px_rgba(148,163,184,0.14),-4px_-4px_10px_rgba(255,255,255,0.85)] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200 text-sm font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  title={`Account options for ${user?.name || 'User'}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {avatar}
                  </div>
                  <span className="font-bold max-w-[110px] truncate">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
                  <ChevronDown size={16} className={`text-[#52657A] transition-transform duration-200 ${dropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* REDESIGNED NEUMORPHIC DROPDOWN PANEL */}
                {dropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdown(false)}
                    />
                    <div className="absolute right-0 top-14 w-64 p-2 z-50 rounded-[16px] bg-white border border-[#DCE6F0] shadow-[7px_7px_18px_rgba(148,163,184,0.18),-7px_-7px_18px_rgba(255,255,255,0.90)] animate-fade-in">
                      {/* USER INFO HEADER */}
                      <div className="px-3.5 py-3 mb-1.5 rounded-[12px] bg-[#EDF4FB] border border-[#DCE6F0]">
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
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {avatar}
            </div>
          )}
          <button 
            aria-label="Toggle navigation menu" 
            aria-expanded={mobileOpen}
            className="p-2 rounded-[12px] bg-white border border-[#DCE6F0] text-[#0F172A] shadow-[4px_4px_10px_rgba(148,163,184,0.14)] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#2563EB]" 
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



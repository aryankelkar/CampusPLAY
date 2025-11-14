import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Home as HomeIcon, CalendarCheck, Clock, Settings as SettingsIcon, LogIn, UserPlus, LogOut, ShieldCheck, History, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { user, loading, logout: authLogout } = useAuth();
  const [logoError, setLogoError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);

  useEffect(() => {
    setDropdown(false);
  }, [router.pathname]);

  

  const avatar = useMemo(() => (user?.name ? user.name.charAt(0).toUpperCase() : 'U'), [user?.name]);

  const logout = async () => {
    try {
      await authLogout();
      router.push('/login');
    } catch {}
  };

  return (
    <nav className="sticky top-4 z-[60] mx-auto max-w-6xl px-4">
      <div className="navbar-glass flex h-16 items-center justify-between px-6">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-3 group" title="Home">
          {logoError ? (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 grid place-items-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-sm">CP</span>
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
              <Image src="/campusplay-logo.png" alt="CampusPlay logo" width={40} height={40} priority onError={() => setLogoError(true)} />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight leading-none text-gradient-sport">CampusPlay</span>
            <span className="text-[10px] font-medium tracking-widest text-muted" style={{letterSpacing: '0.1em'}}>SPORTS BOOKING</span>
          </div>
        </Link>

        {/* Center: Links (desktop) */}
        <div className="hidden md:flex items-center gap-1">
          <Link 
            title="Home" 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 uppercase tracking-wider ${
              router.pathname === '/'
                ? 'nav-link-active'
                : 'nav-link'
            }`} 
            href="/"
          >
            <HomeIcon size={18} strokeWidth={2.5} />
            <span>Home</span>
          </Link>
          {user?.role !== 'admin' && (
            <>
              <Link 
                title="Book Ground" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 uppercase tracking-wider ${
                  router.pathname.startsWith('/bookings')
                    ? 'nav-link-active'
                    : 'nav-link'
                }`} 
                href="/bookings"
              >
                <CalendarCheck size={18} strokeWidth={2.5} />
                <span>Book</span>
              </Link>
              <Link 
                title="History" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 uppercase tracking-wider ${
                  router.pathname === '/history'
                    ? 'nav-link-active'
                    : 'nav-link'
                }`} 
                href="/history"
              >
                <History size={18} strokeWidth={2.5} />
                <span>History</span>
              </Link>
            </>
          )}
          <Link 
            title="Availability" 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 uppercase tracking-wider ${
              router.pathname.startsWith('/availability')
                ? 'nav-link-active'
                : 'nav-link'
            }`} 
            href="/availability"
          >
            <Clock size={18} strokeWidth={2.5} />
            <span>Availability</span>
          </Link>
          {user?.role === 'admin' && (
            <Link 
              title="Admin" 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 uppercase tracking-wider ${
                router.pathname.startsWith('/admin')
                  ? 'nav-link-active'
                  : 'nav-link'
              }`} 
              href="/admin/dashboard"
            >
              <ShieldCheck size={18} strokeWidth={2.5} />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Right: Settings + Avatar (desktop) */}
        <div className="hidden md:flex items-center gap-3 relative">
          {!loading && (
          !user ? (
            <div className="flex items-center gap-2">
              <Link 
                title="About" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 uppercase tracking-wider ${
                  router.pathname === '/about'
                    ? 'nav-link-active'
                    : 'nav-link'
                }`} 
                href="/about"
              >
                <Info size={18} strokeWidth={2.5} />
                <span>About</span>
              </Link>
              <Link 
                title="Login" 
                className="nav-link flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 uppercase tracking-wider" 
                href="/login"
              >
                <LogIn size={18} strokeWidth={2.5} />
                <span>Login</span>
              </Link>
              <Link 
                title="Register" 
                className="btn btn-primary flex items-center gap-2 text-sm uppercase tracking-wider" 
                href="/register"
              >
                <UserPlus size={18} strokeWidth={2.5} />
                <span>Register</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                title="About" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 uppercase tracking-wider ${
                  router.pathname === '/about'
                    ? 'nav-link-active'
                    : 'nav-link'
                }`} 
                href="/about"
              >
                <Info size={18} strokeWidth={2.5} />
                <span>About</span>
              </Link>
              <Link
                title="Settings"
                href="/settings"
                className={`nav-link flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary-50 ${
                  router.pathname === '/settings' ? 'nav-link-active' : ''
                }`}
              >
                <SettingsIcon size={20} strokeWidth={2} />
              </Link>
              <button
                onClick={()=> setDropdown((v)=>!v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg" 
                title={`Logged in as ${user?.name || 'User'}`}
                style={{
                  background: 'linear-gradient(135deg, #22C55E, #2563EB)',
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                }}
              >
                {avatar}
              </button>

              {dropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDropdown(false)}
                  />
                  <div className="modal-content absolute right-0 top-14 w-64 p-2 z-50">
                    <div className="px-3 py-2 mb-1 border-b border-gray-200">
                      <p className="text-sm font-semibold text-primary-950 truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted truncate">{user?.email || ''}</p>
                    </div>
                    <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors" onClick={()=> setDropdown(false)}>
                      <SettingsIcon size={18} strokeWidth={2} /> <span className="font-medium text-sm">Edit Profile</span>
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors" onClick={()=> setDropdown(false)}>
                      <ShieldCheck size={18} strokeWidth={2} /> <span className="font-medium text-sm">Change Password</span>
                    </Link>
                    <div className="my-1 border-t border-gray-200"></div>
                    <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors" onClick={()=> { setDropdown(false); logout(); }}>
                      <LogOut size={18} strokeWidth={2} /> <span className="font-medium text-sm">Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )
          )}
        </div>

        {/* Mobile: hamburger + avatar */}
        <div className="flex items-center gap-3 md:hidden">
          {!loading && user && (
            <div 
              className="flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-xs" 
              style={{
                background: 'linear-gradient(135deg, #22C55E, #2563EB)',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
              }}
            >
              {avatar}
            </div>
          )}
          <button 
            aria-label="Menu" 
            className="flex flex-col gap-1.5 p-2 hover:bg-primary-50 rounded-lg transition-colors" 
            onClick={()=>setMobileOpen(v=>!v)}
          >
            <div className={`h-0.5 w-6 bg-gray-700 rounded-full transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
            <div className={`h-0.5 w-6 bg-gray-700 rounded-full transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`}></div>
            <div className={`h-0.5 w-6 bg-gray-700 rounded-full transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden animate-fade-in" 
            onClick={() => setMobileOpen(false)}
          />
          <div className="modal-content md:hidden absolute left-4 right-4 top-20 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex flex-col p-3">
              {user && (
                <div className="px-4 py-3 rounded-lg mb-3" style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <p className="text-sm font-semibold text-primary-950">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted">{user?.email || ''}</p>
                </div>
              )}
              <Link className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                router.pathname === '/' ? 'text-white bg-gradient-sport' : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50'
              }`} href="/" onClick={()=>setMobileOpen(false)}>
                <HomeIcon size={20} strokeWidth={2.5} /> <span>Home</span>
              </Link>
              {user?.role !== 'admin' && (
                <>
                  <Link className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    router.pathname.startsWith('/bookings') ? 'text-white bg-gradient-sport' : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50'
                  }`} href="/bookings" onClick={()=>setMobileOpen(false)}>
                    <CalendarCheck size={20} strokeWidth={2.5} /> <span>Book Ground</span>
                  </Link>
                  <Link className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    router.pathname === '/history' ? 'text-white bg-gradient-sport' : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50'
                  }`} href="/history" onClick={()=>setMobileOpen(false)}>
                    <History size={20} strokeWidth={2.5} /> <span>History</span>
                  </Link>
                </>
              )}
              <Link className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                router.pathname.startsWith('/availability') ? 'text-white bg-gradient-sport' : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50'
              }`} href="/availability" onClick={()=>setMobileOpen(false)}>
                <Clock size={20} strokeWidth={2.5} /> <span>Availability</span>
              </Link>
              <Link className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                router.pathname === '/about' ? 'text-white bg-gradient-sport' : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50'
              }`} href="/about" onClick={()=>setMobileOpen(false)}>
                <Info size={20} strokeWidth={2.5} /> <span>About</span>
              </Link>
              {user?.role === 'admin' && (
                <Link className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  router.pathname.startsWith('/admin') ? 'text-white bg-gradient-sport' : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50'
                }`} href="/admin/dashboard" onClick={()=>setMobileOpen(false)}>
                  <ShieldCheck size={20} strokeWidth={2.5} /> <span>Admin</span>
                </Link>
              )}
              {!loading && (!user ? (
                <>
                  <div className="my-2 border-t border-gray-200"></div>
                  <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-primary-700 hover:bg-primary-50 font-medium transition-colors" href="/login" onClick={()=>setMobileOpen(false)}>
                    <LogIn size={20} strokeWidth={2.5} /> <span>Login</span>
                  </Link>
                  <Link className="btn btn-primary flex items-center gap-3 font-semibold transition-colors" href="/register" onClick={()=>setMobileOpen(false)}>
                    <UserPlus size={20} strokeWidth={2.5} /> <span>Register</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="my-2 border-t border-gray-200"></div>
                  <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-primary-700 hover:bg-primary-50 font-medium transition-colors" href="/settings" onClick={()=>setMobileOpen(false)}>
                    <SettingsIcon size={20} strokeWidth={2.5} /> <span>Settings</span>
                  </Link>
                  <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:text-red-700 hover:bg-red-50 font-medium transition-colors" onClick={()=>{ setMobileOpen(false); logout(); }}>
                    <LogOut size={20} strokeWidth={2.5} /> <span>Logout</span>
                  </button>
                </>
              ))}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

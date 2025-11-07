import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Home as HomeIcon, CalendarCheck, Clock, Settings as SettingsIcon, LogIn, UserPlus, LogOut, ShieldCheck, History } from 'lucide-react';
import api from '../lib/api';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; email?: string } | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data?.data?.user || null);
      } catch {}
    };
    fetchMe();
  }, [router.pathname]);

  

  const avatar = useMemo(() => (user?.name ? user.name.charAt(0).toUpperCase() : 'U'), [user?.name]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      router.push('/login');
    } catch {}
  };

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}
    >
      <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-5">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2 text-white" title="Home">
          {logoError ? (
            <span aria-hidden className="grid h-9 w-9 place-items-center rounded-lg bg-white/80 text-blue-700 shadow transition-transform hover:scale-105">CP</span>
          ) : (
            <Image src="/campusplay-logo.png" alt="CampusPlay logo" width={36} height={36} priority className="rounded-md transition-transform hover:scale-105" onError={() => setLogoError(true)} />
          )}
          <span className="text-2xl font-semibold tracking-wide">CampusPlay</span>
        </Link>

        {/* Center: Links (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <Link title="Home" className={`group flex items-center gap-2 text-white/90 font-medium text-base px-3 py-2 rounded-md transition-all hover:-translate-y-0.5 ${router.pathname==='/'?'border-b-2 border-white/80':''}`} href="/">
            <HomeIcon size={20} className="opacity-90 group-hover:opacity-100" />
            <span>Home</span>
          </Link>
          {user?.role !== 'admin' && (
            <>
              <Link title="Book Ground" className={`group flex items-center gap-2 text-white/90 font-medium text-base px-3 py-2 rounded-md transition-all hover:-translate-y-0.5 ${router.pathname.startsWith('/bookings')?'border-b-2 border-white/80':''}`} href="/bookings">
                <CalendarCheck size={20} className="opacity-90 group-hover:opacity-100" />
                <span>Book Ground</span>
              </Link>
              <Link title="History" className={`group flex items-center gap-2 text-white/90 font-medium text-base px-3 py-2 rounded-md transition-all hover:-translate-y-0.5 ${router.pathname==='/history'?'border-b-2 border-white/80':''}`} href="/history">
                <History size={20} className="opacity-90 group-hover:opacity-100" />
                <span>History</span>
              </Link>
            </>
          )}
          <Link title="Availability" className={`group flex items-center gap-2 text-white/90 font-medium text-base px-3 py-2 rounded-md transition-all hover:-translate-y-0.5 ${router.pathname.startsWith('/availability')?'border-b-2 border-white/80':''}`} href="/availability">
            <Clock size={20} className="opacity-90 group-hover:opacity-100" />
            <span>Availability</span>
          </Link>
          {user?.role === 'admin' && (
            <Link title="Admin" className={`group flex items-center gap-2 text-white/90 font-medium text-base px-3 py-2 rounded-md transition-all hover:-translate-y-0.5 ${router.pathname.startsWith('/admin')?'border-b-2 border-white/80':''}`} href="/admin/dashboard">
              <ShieldCheck size={20} className="opacity-90 group-hover:opacity-100" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Right: Settings + Avatar (desktop) */}
        <div className="hidden md:flex items-center gap-3 relative">
          {!user ? (
            <div className="flex items-center gap-2">
              <Link title="Login" className={`group flex items-center gap-2 text-white/90 font-medium text-base px-3 py-2 rounded-md transition-all hover:-translate-y-0.5 ${router.pathname==='/login'?'border-b-2 border-white/80':''}`} href="/login">
                <LogIn size={20} className="opacity-90 group-hover:opacity-100" />
                <span>Login</span>
              </Link>
              <Link title="Register" className={`group flex items-center gap-2 text-white/90 font-medium text-base px-3 py-2 rounded-md transition-all hover:-translate-y-0.5 ${router.pathname==='/register'?'border-b-2 border-white/80':''}`} href="/register">
                <UserPlus size={20} className="opacity-90 group-hover:opacity-100" />
                <span>Register</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                title="Settings"
                className={`group flex items-center gap-2 text-white/90 font-medium text-base px-3 py-2 rounded-md transition-all hover:-translate-y-0.5 ${router.pathname==='/settings'?'border-b-2 border-white/80':''}`}
                onClick={()=> setDropdown((v)=>!v)}
              >
                <SettingsIcon size={20} className="opacity-90 group-hover:opacity-100" />
                <span>Settings</span>
              </button>
              <div className="avatar" title={`Logged in as ${user?.name||'User'}`} style={{
                background:'transparent',
                color:'#ffffff',
                fontWeight:600,
                fontSize:'0.95rem',
                borderRadius:'9999px',
                width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',
                border:'1px solid rgba(255,255,255,0.9)'
              }}>{avatar}</div>

              {dropdown && (
                <div className="absolute right-0 top-[60px] w-56 rounded-xl bg-white p-2 shadow-lg">
                  <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-800 hover:bg-gray-100" onClick={()=> setDropdown(false)}>
                    <SettingsIcon size={18} className="text-slate-700" /> <span>Edit Profile</span>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-800 hover:bg-gray-100" onClick={()=> setDropdown(false)}>
                    <ShieldCheck size={18} className="text-slate-700" /> <span>Change Password</span>
                  </Link>
                  <button className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-left text-slate-800 hover:bg-gray-100" onClick={()=> { setDropdown(false); logout(); }}>
                    <LogOut size={18} className="text-slate-700" /> <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile: hamburger + avatar */}
        <div className="flex items-center gap-3 md:hidden">
          {user && <div className="avatar" style={{background:'transparent',color:'#fff',fontWeight:600,fontSize:'0.95rem',borderRadius:'9999px',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,0.9)'}}>{avatar}</div>}
          <button aria-label="Menu" className="hamburger" onClick={()=>setMobileOpen(v=>!v)}>
            <div></div><div></div><div></div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileOpen ? 'block' : 'hidden'}`}>
        <div className="absolute right-0 top-[70px] w-56 rounded-b-xl bg-white p-3 shadow-lg">
          <div className="flex flex-col">
            <Link className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-800 hover:bg-gray-100" href="/" onClick={()=>setMobileOpen(false)}>
              <HomeIcon size={20} /> <span>Home</span>
            </Link>
            {user?.role !== 'admin' && (
              <>
                <Link className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-800 hover:bg-gray-100" href="/bookings" onClick={()=>setMobileOpen(false)}>
                  <CalendarCheck size={20} /> <span>Book Ground</span>
                </Link>
                <Link className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-800 hover:bg-gray-100" href="/history" onClick={()=>setMobileOpen(false)}>
                  <History size={20} /> <span>History</span>
                </Link>
              </>
            )}
            <Link className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-800 hover:bg-gray-100" href="/availability" onClick={()=>setMobileOpen(false)}>
              <Clock size={20} /> <span>Availability</span>
            </Link>
            {user?.role === 'admin' && (
              <Link className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-800 hover:bg-gray-100" href="/admin/dashboard" onClick={()=>setMobileOpen(false)}>
                <ShieldCheck size={20} /> <span>Admin</span>
              </Link>
            )}
            {!user ? (
              <>
                <Link className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-800 hover:bg-gray-100" href="/login" onClick={()=>setMobileOpen(false)}>
                  <LogIn size={20} /> <span>Login</span>
                </Link>
                <Link className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-800 hover:bg-gray-100" href="/register" onClick={()=>setMobileOpen(false)}>
                  <UserPlus size={20} /> <span>Register</span>
                </Link>
              </>
            ) : (
              <>
                <Link className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-800 hover:bg-gray-100" href="/settings" onClick={()=>setMobileOpen(false)}>
                  <SettingsIcon size={20} /> <span>Settings</span>
                </Link>
                <button className="flex items-center gap-2 px-3 py-2 rounded-md text-left text-slate-800 hover:bg-gray-100" onClick={()=>{ setMobileOpen(false); logout(); }}>
                  <LogOut size={20} /> <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

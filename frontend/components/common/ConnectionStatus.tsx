import { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { RefreshCw } from 'lucide-react';

export default function ConnectionStatus() {
  const { connected } = useSocket();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let t: any;
    if (!connected) {
      t = setTimeout(() => setShow(true), 1000);
    } else {
      setShow(false);
      if (t) clearTimeout(t);
    }
    return () => { if (t) clearTimeout(t); };
  }, [connected]);

  if (connected || !show) return null;

  return (
    <aside
      aria-label="Server Connection Status"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0F172A] text-white shadow-[0_8px_24px_rgba(15,23,42,0.35)] border border-slate-700/80 backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <RefreshCw size={13} className="animate-spin text-amber-400 flex-shrink-0" />
        <span className="text-xs font-bold tracking-wide text-white select-none">
          Reconnecting...
        </span>
        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 select-none">
          Server Offline
        </span>
      </div>
    </aside>
  );
}

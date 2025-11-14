import { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function ConnectionStatus() {
  const { connected } = useSocket();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let t: any;
    if (!connected) {
      t = setTimeout(() => setShow(true), 1500);
    } else {
      setShow(false);
      if (t) clearTimeout(t);
    }
    return () => { if (t) clearTimeout(t); };
  }, [connected]);

  if (connected || !show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <div className="card px-4 py-2 bg-accent-600 text-white shadow-lg flex items-center gap-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
          <span className="font-medium">Reconnecting...</span>
        </div>
      </div>
    </div>
  );
}

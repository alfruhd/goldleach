import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const Header: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0d1117] border-b border-slate-800 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm tracking-tight shadow-sm">
            GL
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-white">GoldLeach</span>
              <span className="text-[11px] font-mono font-medium text-slate-400">v1.0</span>
            </div>
            <p className="text-xs text-slate-400">
              Vat &amp; CIL Reagent Calculator
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isOnline ? (
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>Offline Mode</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

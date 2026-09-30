import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, ShieldAlert } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-[#0b0d17]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 p-[1px] flex items-center justify-center shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#0e1320] rounded-[7px] flex items-center justify-center font-black text-amber-400 text-lg">
              GL
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white m-0">GoldLeach</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-wider">
                FIELD CALC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium -mt-0.5">
              Protective Alkalinity & NaCN Controller
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isOnline ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Online</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Ready</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Field Sunlight & Safety Notice Bar */}
      <div className="max-w-2xl mx-auto mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center text-amber-400/90 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 mr-1 inline" /> Target pH: 10.8 (Safety Buffer &ge; 10.5)
        </span>
        <span className="text-slate-400">Strict Offline DB</span>
      </div>
    </header>
  );
};

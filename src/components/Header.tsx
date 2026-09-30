import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const { theme, toggleTheme } = useTheme();

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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 transition-colors">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Logo size={32} />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                GoldLeach
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
              Vat &amp; CIL Reagent Calculator
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Online/Offline status pill */}
          {isOnline ? (
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-slate-700/60 text-emerald-700 dark:text-slate-300 text-xs font-medium">
              <Wifi className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium">
              <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Offline Mode</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

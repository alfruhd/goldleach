import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calculator, ClipboardList, Database } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    {
      to: '/',
      label: 'Calculator',
      sublabel: 'Batch Dosing',
      icon: Calculator,
    },
    {
      to: '/history',
      label: 'Ledger',
      sublabel: 'Batch History',
      icon: ClipboardList,
    },
    {
      to: '/vats',
      label: 'Tanks',
      sublabel: 'Vat Configs',
      icon: Database,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#07090e]/95 backdrop-blur-lg border-t border-slate-800 pb-[env(safe-area-inset-bottom,8px)] pt-1">
      <div className="max-w-2xl mx-auto flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 py-2 px-1 flex flex-col items-center justify-center transition-all duration-150 rounded-xl relative group min-h-[56px] ${
                  isActive
                    ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 mb-0.5 transition-transform ${
                      isActive ? 'scale-110 text-amber-400 stroke-[2.4]' : 'stroke-[1.8]'
                    }`}
                  />
                  <span className="text-xs tracking-tight leading-none mt-0.5">
                    {item.label}
                  </span>
                  <span className={`text-[9px] mt-0.5 leading-none font-normal ${isActive ? 'text-amber-300/80' : 'text-slate-400'}`}>
                    {item.sublabel}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

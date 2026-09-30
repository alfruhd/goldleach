import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calculator, ClipboardList, Settings2 } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    {
      to: '/',
      label: 'Calculator',
      icon: Calculator,
    },
    {
      to: '/history',
      label: 'Batch Ledger',
      icon: ClipboardList,
    },
    {
      to: '/vats',
      label: 'Tank Config',
      icon: Settings2,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117] border-t border-slate-800 pb-[env(safe-area-inset-bottom,8px)]">
      <div className="max-w-2xl mx-auto flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 py-3 px-2 flex flex-col items-center justify-center transition-colors min-h-[56px] ${
                  isActive
                    ? 'text-amber-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 mb-1 transition-colors ${
                      isActive ? 'text-amber-400 stroke-[2.2]' : 'text-slate-400 stroke-[1.8]'
                    }`}
                  />
                  <span className="text-xs tracking-tight leading-tight">
                    {item.label}
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

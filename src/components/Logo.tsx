import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-lg bg-gradient-to-b from-[#1e1710] to-[#0a0705] border border-amber-500/20 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${className}`}
    >
      <img
        src="/logo.png"
        alt="GoldLeach Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain drop-shadow"
      />
    </div>
  );
};

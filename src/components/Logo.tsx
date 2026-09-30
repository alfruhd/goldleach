import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      {/* Container Background */}
      <rect
        width="32"
        height="32"
        rx="8"
        className="fill-slate-900 dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800"
        strokeWidth="1"
      />

      {/* Vat / Tank geometry outline */}
      <path
        d="M8 9H24V20C24 22.2091 22.2091 24 20 24H12C9.79086 24 8 22.2091 8 20V9Z"
        className="stroke-slate-400 dark:stroke-slate-500"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Leaching Solution level */}
      <path
        d="M8.5 16.5C10 16 12 17 14 16.5C16 16 18 17 20 16.5C21.5 16 23 16.5 23.5 16.5V20C23.5 21.933 21.933 23.5 20 23.5H12C10.067 23.5 8.5 21.933 8.5 20V16.5Z"
        fill="#06b6d4"
        fillOpacity="0.25"
      />
      <path
        d="M8.5 16.5C10 16 12 17 14 16.5C16 16 18 17 20 16.5C21.5 16 23 16.5 23.5 16.5"
        stroke="#06b6d4"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Precision Gold Diamond / Crystal (Au) */}
      <path
        d="M16 7L19.5 12L16 15.5L12.5 12L16 7Z"
        fill="#f59e0b"
        stroke="#d97706"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Inner facet light */}
      <path
        d="M16 7L19.5 12H12.5L16 7Z"
        fill="#fbbf24"
      />
    </svg>
  );
};

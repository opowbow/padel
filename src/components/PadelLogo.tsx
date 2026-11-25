import React from 'react';

interface PadelLogoProps {
  className?: string;
}

export const PadelLogo: React.FC<PadelLogoProps> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-label="Padel racquet and tennis ball logo"
    >
      <defs>
        <linearGradient id="hdrBgGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="55%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="hdrRimGrad" x1="12" y1="8" x2="46" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <linearGradient id="hdrBallGrad" x1="36" y1="34" x2="58" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ecfccb" />
          <stop offset="45%" stopColor="#bef264" />
          <stop offset="100%" stopColor="#65a30d" />
        </linearGradient>
        <clipPath id="hdrBallClip">
          <circle cx="46.5" cy="45.5" r="9.5" />
        </clipPath>
      </defs>

      {/* Rounded App Icon Tile */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill="url(#hdrBgGrad)"
        stroke="#38bdf8"
        strokeOpacity="0.55"
        strokeWidth="2.2"
      />

      {/* Padel Racquet */}
      <g transform="rotate(-38 30 30)">
        {/* Grip Handle */}
        <rect
          x="27"
          y="44"
          width="6"
          height="14"
          rx="2"
          fill="#f1f5f9"
          stroke="#0f172a"
          strokeWidth="1.2"
        />
        <path d="M27 47.5H33M27 51H33M27 54.5H33" stroke="#475569" strokeWidth="1.1" />
        <rect x="26.2" y="56.5" width="7.6" height="2.6" rx="1.2" fill="#f43f5e" />

        {/* Y-Throat */}
        <path
          d="M22.5 34L27 44.5H33L37.5 34H22.5Z"
          fill="url(#hdrRimGrad)"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <path d="M26.8 36.2L30 42.2L33.2 36.2H26.8Z" fill="#0f172a" />

        {/* Perforated Solid Padel Face */}
        <ellipse
          cx="30"
          cy="21.5"
          rx="14.5"
          ry="16"
          fill="#0f172a"
          stroke="url(#hdrRimGrad)"
          strokeWidth="3.2"
        />
        <ellipse cx="30" cy="21.5" rx="11.6" ry="13" fill="#1e293b" />

        {/* Padel Face Holes */}
        <g fill="#38bdf8">
          <circle cx="25.5" cy="13.5" r="1.35" />
          <circle cx="30" cy="13.5" r="1.35" />
          <circle cx="34.5" cy="13.5" r="1.35" />

          <circle cx="23.2" cy="18" r="1.35" />
          <circle cx="27.7" cy="18" r="1.35" />
          <circle cx="32.3" cy="18" r="1.35" />
          <circle cx="36.8" cy="18" r="1.35" />

          <circle cx="23.2" cy="22.5" r="1.35" />
          <circle cx="27.7" cy="22.5" r="1.35" />
          <circle cx="32.3" cy="22.5" r="1.35" />
          <circle cx="36.8" cy="22.5" r="1.35" />

          <circle cx="25.5" cy="27" r="1.35" />
          <circle cx="30" cy="27" r="1.35" />
          <circle cx="34.5" cy="27" r="1.35" />
        </g>
      </g>

      {/* Tennis Ball */}
      <g>
        <circle
          cx="46.5"
          cy="45.5"
          r="10.5"
          fill="url(#hdrBallGrad)"
          stroke="#0f172a"
          strokeWidth="2"
        />
        <g
          clipPath="url(#hdrBallClip)"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M36.5 39C41.5 41.5 43 47.5 39.5 54" />
          <path d="M56.5 37C51.5 40.5 50 46.5 54 53.5" />
        </g>
      </g>
    </svg>
  );
};

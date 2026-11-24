import React from 'react';

interface PlayerAvatarProps {
  name: string;
  className?: string;
}

const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-sky-400/50',
  'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400/50',
  'bg-gradient-to-br from-pink-500 to-rose-600 text-white border-pink-400/50',
  'bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 border-amber-300/60',
  'bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-indigo-400/50',
  'bg-gradient-to-br from-cyan-500 to-sky-600 text-slate-950 border-cyan-300/60',
];

function getGradientForName(name: string): string {
  const clean = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  className = 'w-8 h-8 rounded-full text-xs',
}) => {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  const colorClasses = getGradientForName(name);

  return (
    <div
      aria-label={name}
      title={name}
      className={`inline-flex items-center justify-center font-black uppercase select-none border shadow-sm shrink-0 ${colorClasses} ${className}`}
    >
      {initial}
    </div>
  );
};

import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'blue' | 'slate';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate' }) => {
  const styles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    slate: 'bg-slate-700/50 text-slate-300 border-slate-600',
  };

  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', styles[variant])}>
      {children}
    </span>
  );
};

'use client';

import { clsx } from 'clsx';

interface CardBackProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  count?: number;
}

const SIZES = {
  xs: { card: 'w-10 h-14', border: 'border-2', text: 'text-[10px]' },
  sm: { card: 'w-14 h-20', border: 'border-[3px]', text: 'text-sm' },
  md: { card: 'w-20 h-28', border: 'border-4', text: 'text-xl' },
  lg: { card: 'w-28 h-40', border: 'border-4', text: 'text-3xl' },
};

export function CardBack({ size = 'md', className, count }: CardBackProps) {
  const sizeStyle = SIZES[size] || SIZES.md;

  return (
    <div className={clsx('relative select-none', className)}>
      <div
        className={clsx(
          sizeStyle.card,
          sizeStyle.border,
          'relative rounded-2xl border-white cursor-pointer select-none',
          'bg-gradient-to-br from-neutral-950 via-zinc-900 to-neutral-950',
          'shadow-xl shadow-black/50 overflow-hidden'
        )}
      >
        {/* Tilted red oval */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[84%] h-[72%] -rotate-[20deg] rounded-[50%] bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-md border border-white/20">
            <span
              className={clsx(
                sizeStyle.text,
                'font-black italic text-yellow-300 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] tracking-wider'
              )}
            >
              UNO
            </span>
          </div>
        </div>

        {/* Gloss overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
      </div>

      {count !== undefined && count > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-600 border-2 border-white text-white text-xs font-black rounded-full px-1.5 py-0.5 shadow-lg min-w-6 text-center">
          {count > 99 ? '99+' : count}
        </div>
      )}
    </div>
  );
}

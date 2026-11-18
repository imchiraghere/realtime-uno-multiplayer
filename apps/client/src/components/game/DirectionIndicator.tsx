'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { RotateCw, RotateCcw } from 'lucide-react';

interface DirectionIndicatorProps {
  direction: 1 | -1;
  playerCount: number;
  className?: string;
}

export function DirectionIndicator({ direction, className }: DirectionIndicatorProps) {
  const isClockwise = direction === 1;

  return (
    <div className={clsx('flex items-center gap-2 select-none', className)}>
      <motion.div
        animate={{
          rotate: isClockwise ? 360 : -360,
        }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 10,
        }}
        className="relative flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-white/5 shadow-inner"
      >
        {isClockwise ? (
          <RotateCw className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
        ) : (
          <RotateCcw className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
        )}
      </motion.div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">
        {isClockwise ? 'CW' : 'CCW'}
      </span>
    </div>
  );
}

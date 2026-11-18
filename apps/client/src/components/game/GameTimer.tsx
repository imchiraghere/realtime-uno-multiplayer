'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface GameTimerProps {
  turnStartedAt: number;
  timerSeconds: number;
  isMyTurn: boolean;
  className?: string;
}

export function GameTimer({ turnStartedAt, timerSeconds, isMyTurn, className }: GameTimerProps) {
  const [remaining, setRemaining] = useState(timerSeconds);

  useEffect(() => {
    const update = () => {
      const elapsed = (Date.now() - turnStartedAt) / 1000;
      const rem = Math.max(0, timerSeconds - elapsed);
      setRemaining(rem);
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [turnStartedAt, timerSeconds]);

  const progress = Math.min(1, Math.max(0, remaining / timerSeconds));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const isUrgent = remaining <= timerSeconds * 0.25;
  const isWarning = remaining <= timerSeconds * 0.5 && !isUrgent;

  const colorClass = isUrgent
    ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
    : isWarning
    ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
    : 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]';

  return (
    <div className={clsx('flex items-center gap-2 select-none', className)}>
      <div className="relative w-9 h-9 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 38 38">
          {/* Background circle track */}
          <circle
            cx="19"
            cy="19"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-white/10"
          />
          {/* Animated progress ring */}
          <circle
            cx="19"
            cy="19"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={clsx('transition-all duration-100', colorClass)}
          />
        </svg>

        {/* Center seconds countdown */}
        <motion.span
          animate={isUrgent ? { scale: [1, 1.15, 1], transition: { repeat: Infinity, duration: 0.8 } } : { scale: 1 }}
          className={clsx(
            'absolute font-black text-xs',
            isUrgent ? 'text-red-400' : isWarning ? 'text-amber-300' : 'text-white'
          )}
        >
          {Math.ceil(remaining)}
        </motion.span>
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">Turn</span>
        <span className={clsx('text-xs font-black tracking-tight', isUrgent ? 'text-red-400 animate-pulse' : isMyTurn ? 'text-emerald-400' : 'text-white/80')}>
          {Math.ceil(remaining)}s
        </span>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { CardBack } from '../cards/CardBack';
import { PublicPlayerState } from '../../types/game';
import { WifiOff } from 'lucide-react';

interface PlayerSeatProps {
  player: PublicPlayerState;
  isCurrentTurn: boolean;
  position: 'top' | 'left' | 'right';
  className?: string;
}

function getAvatarUrl(username: string): string {
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username)}`;
}

export function PlayerSeat({ player, isCurrentTurn, position, className }: PlayerSeatProps) {
  if (!player) return null;

  return (
    <div className={clsx('flex flex-col items-center gap-1.5 select-none', className)}>
      {/* Overlapping card backs */}
      <div className="flex -space-x-4 justify-center items-center py-1">
        {Array.from({ length: Math.min(player.cardCount, 6) }).map((_, i) => (
          <div key={i} style={{ zIndex: i + 1 }}>
            <CardBack size="xs" />
          </div>
        ))}
        {player.cardCount > 6 && (
          <span className="text-white/80 font-bold text-xs pl-5 bg-black/40 px-2 py-0.5 rounded-full">
            +{player.cardCount - 6}
          </span>
        )}
      </div>

      {/* Player badge */}
      <motion.div
        animate={isCurrentTurn ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } } : { scale: 1 }}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all duration-200',
          isCurrentTurn
            ? 'bg-indigo-600/80 border-indigo-300 shadow-xl shadow-indigo-500/40 ring-2 ring-white/50'
            : 'bg-black/40 border-white/10 backdrop-blur-sm'
        )}
      >
        {/* Avatar */}
        <div className="relative">
          <img
            src={player.avatarUrl || getAvatarUrl(player.username)}
            alt={player.username}
            className="w-8 h-8 rounded-full border-2 border-white/30 object-cover"
          />
          <div
            className={clsx(
              'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black',
              player.isConnected ? 'bg-green-500' : 'bg-red-500'
            )}
          />
        </div>

        {/* Name & status */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-white text-xs font-bold truncate max-w-24">{player.username}</span>
            {player.isBot && (
              <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1 rounded font-semibold">BOT</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/70 text-[11px] font-medium">{player.cardCount} cards</span>
            {player.hasCalledUno && player.cardCount === 1 && (
              <span className="text-red-400 text-[11px] font-black animate-bounce">UNO!</span>
            )}
          </div>
        </div>

        {/* Disconnected warning */}
        {!player.isConnected && (
          <WifiOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0 animate-pulse ml-1" />
        )}
      </motion.div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { PublicPlayerState } from '../../types/game';
import { useRouter } from 'next/navigation';
import { useSocketStore } from '../../store/socketStore';
import { useSounds } from '../../hooks/useSounds';
import { clsx } from 'clsx';

interface GameResultProps {
  winner: string | null;
  players: PublicPlayerState[];
  currentUserId: string;
  roomId: string;
}

const MEDALS = ['🥇', '🥈', '🥉', '🏅'];

export function GameResult({ winner, players, currentUserId, roomId }: GameResultProps) {
  const router = useRouter();
  const { socket } = useSocketStore();
  const { play } = useSounds();
  
  const isWinner = winner === currentUserId;
  const winnerPlayer = players.find(p => p.id === winner);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  useEffect(() => {
    if (isWinner) {
      play('win');
    } else {
      play('lose');
    }
  }, [isWinner, play]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 select-none"
    >
      {/* Background radial glow */}
      <div className={clsx(
        'absolute inset-0 pointer-events-none opacity-40',
        isWinner
          ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/30 via-transparent to-transparent'
          : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent'
      )} />

      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        className="relative bg-neutral-950/95 border-2 border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl overflow-hidden"
      >
        {/* Glow halo */}
        <div className={clsx(
          'absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none',
          isWinner ? 'bg-amber-500/40' : 'bg-indigo-600/30'
        )} />

        {/* Winner announcement */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className={clsx('text-6xl sm:text-7xl mb-3', isWinner ? 'animate-bounce' : '')}>
            {isWinner ? '🏆' : '🎮'}
          </div>
          <h2 className={clsx('text-3xl sm:text-4xl font-black mb-1.5 tracking-tight', isWinner ? 'text-amber-400' : 'text-white')}>
            {isWinner ? 'Victory!' : `${winnerPlayer?.username ?? 'Opponent'} Won!`}
          </h2>
          <p className="text-white/60 text-sm mb-6 font-medium">
            {isWinner ? 'Outstanding play! You cleared your entire hand!' : 'Good match! Better luck in the next round!'}
          </p>
        </motion.div>
        
        {/* Ranked Players Leaderboard */}
        <div className="space-y-2 mb-7">
          {sortedPlayers.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.35 + idx * 0.08 }}
              className={clsx(
                'flex items-center justify-between p-3 rounded-2xl border transition-all duration-200',
                player.id === winner
                  ? 'bg-amber-500/20 border-amber-400/50 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 border-white/10'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg w-6 flex justify-center">{MEDALS[idx] || `#${idx + 1}`}</span>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-sm">{player.username}</span>
                    {player.id === currentUserId && <span className="text-indigo-400 text-xs font-semibold">(you)</span>}
                  </div>
                  <span className="text-white/40 text-[11px]">{player.cardCount} cards remaining</span>
                </div>
              </div>
              <span className="text-white font-black text-sm">{player.score} pts</span>
            </motion.div>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 py-3 text-sm font-bold"
            onClick={() => router.push('/lobby')}
          >
            <ArrowRight className="w-4 h-4" />
            Lobby
          </Button>
          <Button
            variant="primary"
            glow
            className="flex-1 py-3 text-sm font-bold"
            onClick={() => {
              play('click');
              socket?.emit('rematch', { roomId });
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Rematch
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

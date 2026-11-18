'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSocketStore } from '../../store/socketStore';
import { useRoomStore } from '../../store/roomStore';
import { GameRoom } from '../../types/room';
import { api } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { Users, Bot, Lock, Sparkles, Clock, Zap, Shield, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [gameMode, setGameMode] = useState<'CLASSIC' | 'HOUSE_RULES' | 'QUICK_MATCH'>('CLASSIC');
  const [turnTimer, setTurnTimer] = useState(30);
  const [allowBots, setAllowBots] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { socket } = useSocketStore();
  const { setCurrentRoom } = useRoomStore();
  const router = useRouter();
  
  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter a room name'); return; }
    
    setLoading(true);
    setError('');
    
    const payload = {
      name: name.trim(),
      isPrivate,
      password: isPrivate ? password : undefined,
      maxPlayers,
      gameMode,
      turnTimerSeconds: turnTimer,
      scoreLimit: 500,
      houseRules: {},
      allowBots,
      spectatorMode: false,
    };

    try {
      // 1. Primary: Create room via HTTP REST API
      const room = await api.post<GameRoom>('/api/rooms', payload);
      
      if (socket && socket.connected) {
        socket.emit('join_room', { code: room.code });
      }

      setCurrentRoom(room);
      setLoading(false);
      onClose();
      router.push(`/room/${room.code}`);
    } catch (httpErr: unknown) {
      // 2. Fallback: Try via Socket.IO if connected
      if (socket && socket.connected) {
        socket.emit('create_room', payload);
        
        socket.once('room_created', ({ room }: { room: GameRoom }) => {
          setCurrentRoom(room);
          setLoading(false);
          onClose();
          router.push(`/room/${room.code}`);
        });
        
        socket.once('error_message', ({ message }: { message: string }) => {
          setError(message);
          setLoading(false);
        });
        
        setTimeout(() => setLoading(false), 6000);
      } else {
        const message = httpErr instanceof Error ? httpErr.message : 'Error creating room';
        setError(message);
        setLoading(false);
      }
    }
  };
  
  const modes = [
    {
      id: 'CLASSIC' as const,
      label: 'Classic',
      desc: 'Standard official UNO rules',
      icon: BookOpen,
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-400',
    },
    {
      id: 'HOUSE_RULES' as const,
      label: 'House Rules',
      desc: 'Stacking draw cards enabled',
      icon: Sparkles,
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-400',
    },
    {
      id: 'QUICK_MATCH' as const,
      label: 'Fast Paced',
      desc: '15-second blitz turns',
      icon: Zap,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-400',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Custom Room" size="lg">
      <div className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            {error}
          </motion.div>
        )}
        
        {/* Room Name Input */}
        <div>
          <label className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
            Room Name
          </label>
          <div className="relative">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Royal Match, Friday Night UNO"
              maxLength={40}
              className="w-full bg-slate-900/80 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 placeholder-white/30 text-sm transition-all shadow-inner"
            />
            {name.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-mono">
                {name.length}/40
              </span>
            )}
          </div>
        </div>
        
        {/* Game Mode Selector */}
        <div>
          <label className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2 block">
            Game Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {modes.map(mode => {
              const Icon = mode.icon;
              const isSelected = gameMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setGameMode(mode.id);
                    if (mode.id === 'QUICK_MATCH') setTurnTimer(15);
                  }}
                  className={clsx(
                    'p-3 rounded-xl border text-left transition-all relative overflow-hidden group',
                    isSelected
                      ? `bg-gradient-to-br ${mode.color} shadow-lg ring-1 ring-white/20`
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={clsx('w-4 h-4', isSelected ? 'text-white' : 'text-white/50')} />
                    <span className="text-sm font-bold text-white">{mode.label}</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">{mode.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Max Players & Turn Timer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Max Players */}
          <div>
            <label className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Max Players</span>
              <span className="text-indigo-400 font-bold">{maxPlayers} Seats</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxPlayers(num)}
                  className={clsx(
                    'py-2.5 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-1.5',
                    maxPlayers === num
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  {num}P
                </button>
              ))}
            </div>
          </div>
          
          {/* Turn Timer Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/70 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-white/40" />
                Turn Timer
              </label>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-indigo-300">
                {turnTimer}s
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={turnTimer}
                onChange={e => setTurnTimer(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>10s (Blitz)</span>
                <span>30s (Default)</span>
                <span>60s (Relaxed)</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Toggles: Private & Bots */}
        <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Fill with Bots</div>
                <div className="text-xs text-white/40">AI players auto-fill empty seats if needed</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAllowBots(!allowBots)}
              className={clsx(
                'w-11 h-6 rounded-full transition-colors relative p-0.5 border',
                allowBots ? 'bg-indigo-600 border-indigo-400' : 'bg-white/10 border-white/20'
              )}
            >
              <motion.div
                className="w-4.5 h-4.5 rounded-full bg-white shadow-sm"
                animate={{ x: allowBots ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          
          <div className="border-t border-white/5 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Private Room</div>
                <div className="text-xs text-white/40">Require a passcode to join this table</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={clsx(
                'w-11 h-6 rounded-full transition-colors relative p-0.5 border',
                isPrivate ? 'bg-amber-600 border-amber-400' : 'bg-white/10 border-white/20'
              )}
            >
              <motion.div
                className="w-4.5 h-4.5 rounded-full bg-white shadow-sm"
                animate={{ x: isPrivate ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          <AnimatePresence>
            {isPrivate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 overflow-hidden"
              >
                <label className="text-white/60 text-xs mb-1 block">Room Passcode</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter secret passcode..."
                  className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 placeholder-white/25 text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            glow
            className="flex-1 font-bold text-base shadow-lg shadow-indigo-600/30"
            loading={loading}
            onClick={handleCreate}
          >
            Launch Room 🚀
          </Button>
        </div>
      </div>
    </Modal>
  );
}

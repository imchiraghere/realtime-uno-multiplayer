'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { Navbar } from '../../../components/layout/Navbar';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../../hooks/useAuth';
import { useSocketStore } from '../../../store/socketStore';
import { useRoomStore } from '../../../store/roomStore';
import { api } from '../../../lib/api';
import { GameRoom } from '../../../types/room';
import { useSounds } from '../../../hooks/useSounds';
import {
  Copy,
  Check,
  Crown,
  Users,
  LogOut,
  Play,
  Clock,
  Bot,
  Sparkles,
  ShieldCheck,
  Zap,
  Share2,
} from 'lucide-react';
import { clsx } from 'clsx';

function getAvatarUrl(username: string): string {
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username)}`;
}

export default function WaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();
  
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocketStore();
  const { currentRoom, setCurrentRoom } = useRoomStore();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const { playClick, playTurnStart, playError } = useSounds();
  
  useEffect(() => {
    if (!isAuthenticated && !user) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);
  
  useEffect(() => {
    if (!socket || !code) return;
    
    const onRoomJoined = ({ room }: { room: GameRoom }) => {
      setCurrentRoom(room);
      setError('');
    };
    
    const onRoomUpdated = ({ room }: { room: GameRoom }) => {
      setCurrentRoom(room);
    };
    
    const onPlayerJoined = ({ room }: { room: GameRoom }) => {
      setCurrentRoom(room);
    };
    
    const onPlayerLeft = ({ room }: { room: GameRoom | null }) => {
      if (!room) router.push('/lobby');
      else setCurrentRoom(room);
    };
    
    const onGameStarted = ({ roomId }: { roomId: string }) => {
      playTurnStart();
      router.push(`/game/${roomId}`);
    };
    
    const onErrorMessage = ({ message }: { message: string }) => {
      setError(message);
      playError();
      setStarting(false);
    };

    const join = () => {
      socket.emit('join_room', { code });
    };
    
    socket.on('connect', join);
    socket.on('room_joined', onRoomJoined);
    socket.on('room_updated', onRoomUpdated);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('game_started', onGameStarted);
    socket.on('error_message', onErrorMessage);

    // Initial join attempt
    join();
    
    return () => {
      socket.off('connect', join);
      socket.off('room_joined', onRoomJoined);
      socket.off('room_updated', onRoomUpdated);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('game_started', onGameStarted);
      socket.off('error_message', onErrorMessage);
    };
  }, [socket, code, router, setCurrentRoom]);
  
  // Sync room via API and poll regularly as a bulletproof realtime fallback
  useEffect(() => {
    if (!code) return;
    let isMounted = true;

    const syncRoom = async () => {
      try {
        const freshRoom = await api.get<GameRoom>(`/api/rooms/${code}`);
        if (!isMounted || !freshRoom) return;

        if (freshRoom.status === 'PLAYING') {
          playTurnStart();
          router.push(`/game/${freshRoom.id}`);
        } else {
          setCurrentRoom(freshRoom);
        }
      } catch {
        // network error / silent retry
      }
    };

    syncRoom();
    const timer = setInterval(syncRoom, 2000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [code, router, setCurrentRoom, playTurnStart]);
  
  const room = currentRoom;
  const isHost = room?.hostId === user?.id;
  const myPlayer = room?.players.find(p => p.userId === user?.id);
  const isReady = myPlayer?.isReady ?? false;
  const allReady = room?.players.every(p => p.isReady || p.userId === room.hostId);
  const canStart = isHost && (room?.players.length ?? 0) >= 2 && allReady;
  
  const handleCopyCode = () => {
    if (!room) return;
    playClick();
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShareLink = () => {
    if (typeof window === 'undefined' || !room) return;
    playClick();
    const url = `${window.location.origin}/room/${room.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  
  const handleReady = async () => {
    if (!room) return;
    playClick();
    const newReady = !isReady;

    // Optimistic UI update
    if (room.players) {
      const updatedPlayers = room.players.map(p =>
        p.userId === user?.id ? { ...p, isReady: newReady } : p
      );
      setCurrentRoom({ ...room, players: updatedPlayers });
    }

    if (socket && socket.connected) {
      socket.emit('player_ready', { roomId: room.id, isReady: newReady });
    }

    try {
      const res = await api.post<GameRoom>(`/api/rooms/${room.code}/ready`, { isReady: newReady });
      if (res) setCurrentRoom(res);
    } catch (err) {
      console.warn('Ready status fallback notice:', err);
    }
  };
  
  const handleStart = async () => {
    if (!room || !canStart) return;
    playClick();
    setStarting(true);
    setError('');

    if (socket && socket.connected) {
      socket.emit('start_game', { roomId: room.id });
    }

    try {
      const res = await api.post<{ success: boolean; data: { room: GameRoom } }>(`/api/rooms/${room.code}/start`);
      if (res?.data?.room?.id) {
        playTurnStart();
        router.push(`/game/${res.data.room.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error starting game';
      setError(message);
      setStarting(false);
    }
  };
  
  const handleLeave = async () => {
    playClick();
    if (room) {
      if (socket && socket.connected) {
        socket.emit('leave_room', { roomId: room.id });
      }
      try {
        await api.post(`/api/rooms/${room.code}/leave`);
      } catch {
        // ignore
      }
    }
    router.push('/lobby');
  };
  
  if (!room) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-white/60 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full mx-auto mb-4" />
          <p className="font-semibold text-white">Connecting to game lobby...</p>
          <p className="text-xs text-white/40 mt-1">Room: {code}</p>
        </div>
      </div>
    );
  }

  const modeBadgeColors: Record<string, string> = {
    CLASSIC: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
    HOUSE_RULES: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
    QUICK_MATCH: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  };
  
  return (
    <div className="min-h-screen bg-hero-gradient selection:bg-indigo-500/30">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          {/* Room Header Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black text-white">{room.name}</h1>
                  <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-full border', modeBadgeColors[room.gameMode] || modeBadgeColors.CLASSIC)}>
                    {room.gameMode.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    {room.players.length}/{room.maxPlayers} Players
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    {room.turnTimerSeconds}s Turn Timer
                  </span>
                  {room.allowBots && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-purple-300">
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                        Bots
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Room Code Pill Box */}
              <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-3 flex items-center justify-between sm:justify-start gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-white/40">Room Code</div>
                  <div className="font-mono font-black text-white text-xl tracking-[0.2em]">
                    {room.code}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyCode}
                    title="Copy code"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleShareLink}
                    title="Copy invite link"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all active:scale-95"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {copied && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                Copied to clipboard! Share it with your friends.
              </motion.div>
            )}
          </div>
          
          {/* Error Notification */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/15 border border-red-500/30 text-red-300 rounded-2xl px-4 py-3 text-sm mb-5 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              {error}
            </motion.div>
          )}
          
          {/* Players Roster */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Roster ({room.players.length}/{room.maxPlayers})
              </h2>
              <span className="text-xs text-white/40">
                {room.players.length < 2 ? 'Need at least 2 players' : allReady ? 'All players ready!' : 'Waiting for ready...'}
              </span>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {room.players.map(player => {
                  const isHostPlayer = player.userId === room.hostId;
                  const isMe = player.userId === user?.id;

                  return (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={clsx(
                        'flex items-center justify-between p-3.5 rounded-2xl border transition-all',
                        isMe
                          ? 'bg-indigo-950/30 border-indigo-500/30 shadow-md shadow-indigo-950/50'
                          : 'bg-white/5 border-white/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={player.user.profile?.avatarUrl || getAvatarUrl(player.user.username)}
                            alt={player.user.username}
                            className="w-11 h-11 rounded-2xl border-2 border-white/15 bg-slate-800 object-cover"
                          />
                          {isHostPlayer && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-500 border border-slate-900 flex items-center justify-center shadow-md">
                              <Crown className="w-3 h-3 text-slate-950 fill-slate-950" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">{player.user.username}</span>
                            {isMe && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-white/40 text-xs flex items-center gap-1.5 mt-0.5">
                            <span>Rating: {player.user.stats?.currentRating ?? 1000}</span>
                            <span>•</span>
                            <span>{player.user.stats?.wins ?? 0} Wins</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ready Badge */}
                      <div className="flex items-center gap-2">
                        {isHostPlayer ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Host
                          </span>
                        ) : player.isReady ? (
                          <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Ready
                          </motion.span>
                        ) : (
                          <span className="text-xs font-medium px-3 py-1 rounded-xl bg-white/5 text-white/40 border border-white/5">
                            Preparing...
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* Empty Open Slots */}
              {Array.from({ length: Math.max(0, room.maxPlayers - room.players.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-between p-3.5 border-2 border-dashed border-white/10 rounded-2xl text-white/30 bg-slate-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl border-2 border-dashed border-white/15 flex items-center justify-center text-white/20">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/50">Open Player Slot</div>
                      <div className="text-xs text-white/30">
                        {room.allowBots ? 'Will auto-fill with bot if game starts' : 'Waiting for player to join'}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-indigo-400/60 font-mono font-medium">Slot #{room.players.length + i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Controls */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleLeave}
              className="flex items-center gap-2 px-5"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              Leave
            </Button>
            
            {!isHost && (
              <Button
                variant={isReady ? 'danger' : 'success'}
                glow={!isReady}
                className="flex-1 font-bold text-base h-12 shadow-lg"
                onClick={handleReady}
              >
                {isReady ? '✗ Cancel Ready' : '✓ Ready Up!'}
              </Button>
            )}
            
            {isHost && (
              <Button
                variant="primary"
                glow={canStart}
                className={clsx(
                  'flex-1 flex items-center gap-2 justify-center font-bold text-base h-12 shadow-xl',
                  canStart && 'shadow-indigo-600/40 ring-2 ring-indigo-400/50'
                )}
                disabled={!canStart}
                loading={starting}
                onClick={handleStart}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Game</span>
              </Button>
            )}
          </div>
          
          {/* Status Hint */}
          <div className="text-center mt-4">
            {!isHost && (
              <p className="text-white/40 text-xs">
                {isReady ? 'Waiting for host to start the game...' : 'Click "Ready Up" when you are prepared to play!'}
              </p>
            )}
            {isHost && !canStart && (
              <p className="text-amber-400/80 text-xs flex items-center justify-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {room.players.length < 2
                  ? 'Need at least 2 players to start the match'
                  : 'Waiting for all players to click "Ready Up"'}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

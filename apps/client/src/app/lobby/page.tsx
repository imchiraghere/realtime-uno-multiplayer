'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Navbar } from '../../components/layout/Navbar';
import { CreateRoomModal } from '../../components/lobby/CreateRoomModal';
import { JoinRoomModal } from '../../components/lobby/JoinRoomModal';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useRoomStore } from '../../store/roomStore';
import { api } from '../../lib/api';
import { GameRoom } from '../../types/room';
import { useSounds } from '../../hooks/useSounds';
import {
  Users,
  Plus,
  Hash,
  Zap,
  Bot,
  Trophy,
  Clock,
  Lock,
  Search,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Gamepad2,
  Star,
} from 'lucide-react';
import { clsx } from 'clsx';

function RoomCard({ room, onJoin }: { room: GameRoom; onJoin: () => void }) {
  const isFull = room.players.length >= room.maxPlayers;
  const { playClick } = useSounds();
  
  const modeStyles: Record<string, { badge: string; text: string }> = {
    CLASSIC: { badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300', text: 'Classic' },
    HOUSE_RULES: { badge: 'bg-purple-500/15 border-purple-500/30 text-purple-300', text: 'House Rules' },
    QUICK_MATCH: { badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300', text: 'Quick Match' },
  };

  const style = modeStyles[room.gameMode] || modeStyles.CLASSIC;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      onClick={() => {
        playClick();
        onJoin();
      }}
      className="group relative bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-indigo-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden"
    >
      {/* Top subtle glow highlight */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header: Room Name, Game Mode & Room Code */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="text-white font-bold text-base truncate group-hover:text-indigo-200 transition-colors">
              {room.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-full border', style.badge)}>
                {style.text}
              </span>
              {room.isPrivate && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-medium">
                  <Lock className="w-2.5 h-2.5" />
                  Passcode
                </span>
              )}
            </div>
          </div>

          <span className="text-xs bg-white/10 group-hover:bg-indigo-500/20 group-hover:text-indigo-200 text-white/70 rounded-lg px-2.5 py-1 font-mono font-bold tracking-wider transition-colors border border-white/5">
            {room.code}
          </span>
        </div>

        {/* Room Attributes */}
        <div className="flex items-center gap-3.5 text-xs text-white/60 mb-4">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className={room.players.length === room.maxPlayers ? 'text-amber-400' : 'text-white/80'}>
              {room.players.length}/{room.maxPlayers}
            </span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            {room.turnTimerSeconds}s
          </span>
          {room.allowBots && (
            <span className="flex items-center gap-1 text-purple-300/80 font-medium">
              <Bot className="w-3 h-3 text-purple-400" />
              Bots
            </span>
          )}
        </div>
      </div>

      {/* Player Slot Indicators & Action Button */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center -space-x-1.5">
          {room.players.map((p, i) => (
            <div
              key={p.id || i}
              title={p.user.username}
              className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-700 to-violet-500 border-2 border-slate-900 flex items-center justify-center text-xs text-white font-black shadow-sm"
            >
              {p.user.username[0]?.toUpperCase()}
            </div>
          ))}
          {Array.from({ length: Math.max(0, room.maxPlayers - room.players.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-7 h-7 rounded-full border-2 border-dashed border-white/20 bg-slate-800/40 flex items-center justify-center text-[10px] text-white/30"
            >
              +
            </div>
          ))}
        </div>

        <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          {isFull ? 'Spectate' : 'Join'}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </motion.div>
  );
}

export default function LobbyPage() {
  const router = useRouter();
  const { user, isAuthenticated, loginAsGuest } = useAuth();
  const { publicRooms, setPublicRooms } = useRoomStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { playClick } = useSounds();
  
  useSocket();
  
  useEffect(() => {
    if (!isAuthenticated) {
      loginAsGuest().catch(() => router.push('/login'));
    }
  }, [isAuthenticated, loginAsGuest, router]);
  
  const fetchRooms = async () => {
    try {
      setIsRefreshing(true);
      const rooms = await api.get<GameRoom[]>('/api/rooms');
      setPublicRooms(rooms);
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);
  
  const filteredRooms = publicRooms.filter(room => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return room.name.toLowerCase().includes(query) || room.code.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-hero-gradient selection:bg-indigo-500/30">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* User Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/50 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl relative overflow-hidden"
        >
          {/* Background ambient orb */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30 border border-white/20">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{user?.username || 'Guest Player'}</h1>
                {user?.isGuest ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Guest
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                )}
              </div>
              <p className="text-white/50 text-xs mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  {user?.stats?.currentRating ?? 1000} Rating
                </span>
                <span>•</span>
                <span>Level {user?.stats?.level ?? 1}</span>
                <span>•</span>
                <span>{user?.stats?.wins ?? 0} Wins</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 z-10">
            <Button
              variant="primary"
              glow
              className="flex items-center gap-2 font-bold px-5"
              onClick={() => {
                playClick();
                setShowCreate(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Create Room
            </Button>
            <Button
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => {
                playClick();
                setJoinCode('');
                setShowJoin(true);
              }}
            >
              <Hash className="w-4 h-4 text-indigo-400" />
              Enter Code
            </Button>
          </div>
        </motion.div>
        
        {/* Quick Action Tiles */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-10"
        >
          <button
            onClick={() => {
              playClick();
              setShowCreate(true);
            }}
            className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all text-left group flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Create Game</div>
              <div className="text-[11px] text-white/40">Custom rules & timer</div>
            </div>
          </button>

          <button
            onClick={() => {
              playClick();
              setJoinCode('');
              setShowJoin(true);
            }}
            className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all text-left group flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Join by Code</div>
              <div className="text-[11px] text-white/40">Enter 6-char room code</div>
            </div>
          </button>

          <button
            onClick={() => {
              playClick();
              setShowCreate(true);
            }}
            className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-amber-500/50 hover:bg-amber-950/20 transition-all text-left group flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Quick Match</div>
              <div className="text-[11px] text-white/40">Instant fast action</div>
            </div>
          </button>

          <button
            onClick={() => {
              playClick();
              router.push('/leaderboard');
            }}
            className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-purple-500/50 hover:bg-purple-950/20 transition-all text-left group flex flex-col justify-between h-28"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Leaderboards</div>
              <div className="text-[11px] text-white/40">Global top champions</div>
            </div>
          </button>
        </motion.div>
        
        {/* Public Rooms Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <h2 className="text-xl font-black text-white tracking-tight">Active Rooms</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-mono">
                {publicRooms.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter rooms..."
                  className="bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-all w-44"
                />
              </div>

              <button
                onClick={fetchRooms}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                title="Refresh room list"
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', isRefreshing && 'animate-spin text-indigo-400')} />
              </button>
            </div>
          </div>
          
          {filteredRooms.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-3xl">
                🃏
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {searchQuery ? 'No rooms match your filter' : 'No open rooms available right now'}
              </h3>
              <p className="text-sm text-white/40 max-w-sm mx-auto mb-6">
                {searchQuery
                  ? 'Try checking for typos or clear your search query.'
                  : 'Host your own match and invite friends or bots to join!'}
              </p>
              <Button
                variant="primary"
                glow
                className="font-bold"
                onClick={() => {
                  playClick();
                  setShowCreate(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create First Room
              </Button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredRooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onJoin={() => {
                      setJoinCode(room.code);
                      setShowJoin(true);
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      <CreateRoomModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <JoinRoomModal isOpen={showJoin} onClose={() => setShowJoin(false)} initialCode={joinCode} />
    </div>
  );
}

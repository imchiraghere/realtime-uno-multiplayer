'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { User } from '../../types/user';
import { Trophy, Gamepad2, TrendingUp, Star, Award, Shield, Sparkles, Clock, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

function getAvatarUrl(username: string): string {
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username)}`;
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; result: string; score: number; createdAt: string }>>([]);
  
  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);
  
  useEffect(() => {
    if (!user) return;
    api.get<User>(`/api/users/${user.id}`).then(setProfile).catch(() => {});
    api.get<typeof history>('/api/users/me/history').then(setHistory).catch(() => {});
  }, [user]);
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-white/60 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full mx-auto mb-4" />
          <p className="text-sm font-semibold text-white">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  const stats = profile.stats ?? {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    highestScore: 0,
    currentRating: 1000,
    level: 1,
    xp: 0,
  };

  const xpCurrent = stats.xp % 500;
  const xpPercent = Math.min(100, Math.round((xpCurrent / 500) * 100));
  
  return (
    <div className="min-h-screen bg-hero-gradient selection:bg-indigo-500/30">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* User Profile Banner Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xl relative overflow-hidden">
            {/* Ambient background blur */}
            <div className="absolute right-0 top-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <img
                src={profile.profile?.avatarUrl || getAvatarUrl(profile.username)}
                alt={profile.username}
                className="w-24 h-24 rounded-3xl border-3 border-indigo-500/40 bg-slate-800 object-cover shadow-xl shadow-indigo-500/10"
              />
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-indigo-600 border border-slate-900 text-[10px] font-black text-white shadow-md">
                LVL {stats.level}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-black text-white truncate">{profile.username}</h1>
                {profile.isGuest ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Guest Account
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Member
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-white/60">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {stats.currentRating} Rating
                </span>
                <span>•</span>
                <span>{stats.xp} Total XP</span>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-medium text-white/50 mb-1.5">
                  <span>Level {stats.level} Progress</span>
                  <span className="font-mono text-indigo-300">{xpCurrent} / 500 XP ({xpPercent}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Key Metrics Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              {
                label: 'Total Matches',
                value: stats.totalGames,
                icon: <Gamepad2 className="w-5 h-5 text-blue-400" />,
                bg: 'from-blue-500/10 to-transparent border-blue-500/20',
              },
              {
                label: 'Victories',
                value: stats.wins,
                icon: <Trophy className="w-5 h-5 text-yellow-400" />,
                bg: 'from-yellow-500/10 to-transparent border-yellow-500/20',
              },
              {
                label: 'Win Rate',
                value: `${stats.winRate.toFixed(0)}%`,
                icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
                bg: 'from-emerald-500/10 to-transparent border-emerald-500/20',
              },
              {
                label: 'Record Score',
                value: stats.highestScore,
                icon: <Award className="w-5 h-5 text-purple-400" />,
                bg: 'from-purple-500/10 to-transparent border-purple-500/20',
              },
            ].map(({ label, value, icon, bg }) => (
              <div
                key={label}
                className={clsx(
                  'bg-gradient-to-b bg-slate-900/60 backdrop-blur-md border rounded-2xl p-4 text-center shadow-lg transition-transform hover:-translate-y-0.5',
                  bg
                )}
              >
                <div className="flex justify-center mb-2">{icon}</div>
                <div className="text-white font-black font-mono text-2xl">{value}</div>
                <div className="text-white/40 text-[11px] font-medium mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          
          {/* Recent Match History */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Match History
            </h2>

            {history.length === 0 ? (
              <div className="text-center py-10 text-white/40">
                <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No recorded matches yet</p>
                <p className="text-xs text-white/30">Your completed game logs will appear here</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map(match => {
                  const isWin = match.result === 'WIN';

                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={clsx(
                            'text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 border',
                            isWin
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          )}
                        >
                          {isWin ? '🏆 Victory' : '💀 Defeat'}
                        </span>
                        <span className="text-white/80 font-mono text-sm font-semibold">
                          {match.score} pts
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-white/40 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(match.createdAt).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

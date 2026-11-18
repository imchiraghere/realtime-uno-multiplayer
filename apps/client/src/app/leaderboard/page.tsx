'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../../components/layout/Navbar';
import { api } from '../../lib/api';
import { Trophy, Star, Crown, Medal, TrendingUp, Sparkles, Flame } from 'lucide-react';
import { clsx } from 'clsx';

interface LeaderboardEntry {
  userId: string;
  currentRating: number;
  wins: number;
  totalGames: number;
  winRate: number;
  level: number;
  user: { username: string; profile?: { avatarUrl?: string } };
}

function getAvatarUrl(username: string): string {
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username)}`;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'rating' | 'wins'>('rating');
  
  useEffect(() => {
    api.get<LeaderboardEntry[]>('/api/leaderboard')
      .then(data => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  const sortedEntries = [...entries].sort((a, b) => {
    if (filter === 'wins') return b.wins - a.wins;
    return b.currentRating - a.currentRating;
  });

  const topThree = sortedEntries.slice(0, 3);
  const restEntries = sortedEntries.slice(3);

  return (
    <div className="min-h-screen bg-hero-gradient selection:bg-indigo-500/30">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Hall of Champions</h1>
                <p className="text-white/50 text-xs">Global competitive rankings and ratings</p>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex bg-slate-900/80 border border-white/10 rounded-xl p-1 self-start sm:self-auto">
              <button
                onClick={() => setFilter('rating')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                  filter === 'rating'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-white/50 hover:text-white'
                )}
              >
                Top Rating
              </button>
              <button
                onClick={() => setFilter('wins')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                  filter === 'wins'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-white/50 hover:text-white'
                )}
              >
                Most Wins
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-24 text-white/50">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full mx-auto mb-4" />
              <p className="text-sm font-medium">Fetching global standings...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-white/5">
              <Trophy className="w-14 h-14 mx-auto mb-4 text-white/20" />
              <h3 className="text-lg font-bold text-white mb-1">No ranked players yet</h3>
              <p className="text-sm text-white/40">Play your first match and claim the top spot!</p>
            </div>
          ) : (
            <>
              {/* Podium for Top 3 */}
              {topThree.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end mb-10 pt-8">
                  {/* 2nd Place (Silver) */}
                  {topThree[1] ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-slate-900/60 backdrop-blur-md border border-slate-400/30 rounded-2xl p-4 text-center flex flex-col items-center relative shadow-lg"
                    >
                      <div className="absolute -top-4 w-8 h-8 rounded-full bg-slate-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md border-2 border-slate-900">
                        2
                      </div>
                      <img
                        src={topThree[1].user.profile?.avatarUrl || getAvatarUrl(topThree[1].user.username)}
                        alt={topThree[1].user.username}
                        className="w-14 h-14 rounded-full border-2 border-slate-400/50 mb-2 mt-2 bg-slate-800 object-cover"
                      />
                      <div className="font-bold text-white text-sm truncate max-w-full">
                        {topThree[1].user.username}
                      </div>
                      <div className="text-slate-300 font-mono font-black text-sm flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 fill-slate-300" />
                        {topThree[1].currentRating}
                      </div>
                      <div className="text-[11px] text-white/40 mt-1">
                        {topThree[1].wins}W • {topThree[1].winRate.toFixed(0)}%
                      </div>
                    </motion.div>
                  ) : <div />}

                  {/* 1st Place (Gold) */}
                  {topThree[0] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-b from-amber-500/15 via-slate-900/70 to-slate-900/80 backdrop-blur-md border border-amber-500/40 rounded-3xl p-5 text-center flex flex-col items-center relative shadow-2xl shadow-amber-500/10 -mt-6"
                    >
                      <div className="absolute -top-6 w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg border-2 border-slate-900">
                        <Crown className="w-6 h-6 fill-slate-950" />
                      </div>
                      <img
                        src={topThree[0].user.profile?.avatarUrl || getAvatarUrl(topThree[0].user.username)}
                        alt={topThree[0].user.username}
                        className="w-18 h-18 rounded-full border-3 border-amber-400 mb-2 mt-4 bg-slate-800 object-cover shadow-md shadow-amber-500/30"
                      />
                      <div className="font-black text-white text-base truncate max-w-full">
                        {topThree[0].user.username}
                      </div>
                      <div className="text-amber-400 font-mono font-black text-lg flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-amber-400" />
                        {topThree[0].currentRating}
                      </div>
                      <div className="text-xs text-amber-300/80 font-medium mt-1">
                        {topThree[0].wins} Wins • {topThree[0].winRate.toFixed(0)}% WR
                      </div>
                    </motion.div>
                  )}

                  {/* 3rd Place (Bronze) */}
                  {topThree[2] ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-slate-900/60 backdrop-blur-md border border-orange-500/30 rounded-2xl p-4 text-center flex flex-col items-center relative shadow-lg"
                    >
                      <div className="absolute -top-4 w-8 h-8 rounded-full bg-orange-600 text-white font-black flex items-center justify-center text-xs shadow-md border-2 border-slate-900">
                        3
                      </div>
                      <img
                        src={topThree[2].user.profile?.avatarUrl || getAvatarUrl(topThree[2].user.username)}
                        alt={topThree[2].user.username}
                        className="w-14 h-14 rounded-full border-2 border-orange-500/50 mb-2 mt-2 bg-slate-800 object-cover"
                      />
                      <div className="font-bold text-white text-sm truncate max-w-full">
                        {topThree[2].user.username}
                      </div>
                      <div className="text-orange-400 font-mono font-black text-sm flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 fill-orange-400" />
                        {topThree[2].currentRating}
                      </div>
                      <div className="text-[11px] text-white/40 mt-1">
                        {topThree[2].wins}W • {topThree[2].winRate.toFixed(0)}%
                      </div>
                    </motion.div>
                  ) : <div />}
                </div>
              )}

              {/* Ranks 4 and Below */}
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {restEntries.map((entry, idx) => {
                    const rank = idx + 4;

                    return (
                      <motion.div
                        key={entry.userId}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-white/10 hover:border-indigo-500/30 hover:bg-slate-900/80 transition-all group"
                      >
                        <div className="w-8 text-center font-mono font-bold text-sm text-white/40 group-hover:text-white">
                          #{rank}
                        </div>
                        
                        <img
                          src={entry.user.profile?.avatarUrl || getAvatarUrl(entry.user.username)}
                          alt={entry.user.username}
                          className="w-10 h-10 rounded-full border-2 border-white/10 bg-slate-800 object-cover"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm truncate">{entry.user.username}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Lv.{entry.level}
                            </span>
                          </div>
                          
                          {/* Mini win rate bar */}
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, entry.winRate))}%` }}
                              />
                            </div>
                            <span className="text-white/40 text-[10px] font-mono">
                              {entry.wins}W / {entry.totalGames}G ({entry.winRate.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-white font-black font-mono text-base flex items-center justify-end gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            {entry.currentRating}
                          </div>
                          <div className="text-white/30 text-[10px] uppercase font-semibold">Rating</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

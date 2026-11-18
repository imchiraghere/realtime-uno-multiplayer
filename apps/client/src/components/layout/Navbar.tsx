'use client';

import { useAuthStore } from '../../store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '../ui/Button';
import { User, Trophy, LogOut, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

function getAvatarUrl(username: string): string {
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username)}`;
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-neutral-950/80 backdrop-blur-xl border-b border-white/10 select-none">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl border-2 border-white bg-gradient-to-br from-red-600 via-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-105 transition-transform overflow-hidden relative">
            <div className="w-[85%] h-[72%] -rotate-[20deg] rounded-[50%] bg-white flex items-center justify-center">
              <span className="font-black italic text-red-600 text-[10px] tracking-tight">UNO</span>
            </div>
          </div>
          <span className="font-black text-white text-xl tracking-tight group-hover:text-amber-400 transition-colors">
            UNO <span className="text-red-500 font-extrabold text-sm ml-0.5 uppercase tracking-widest">Online</span>
          </span>
        </Link>
        
        {/* Nav links */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/lobby"
            className={clsx(
              'px-4 py-1.5 rounded-xl text-sm font-bold transition-all',
              pathname === '/lobby'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            Lobby
          </Link>
          <Link
            href="/leaderboard"
            className={clsx(
              'px-4 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5',
              pathname === '/leaderboard'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Leaderboard
          </Link>
          <Link
            href="/cards"
            className={clsx(
              'px-4 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5',
              pathname === '/cards'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Card Deck
          </Link>
        </div>
        
        {/* Auth / Profile */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:border-white/20"
              >
                <img
                  src={user.profile?.avatarUrl || getAvatarUrl(user.username)}
                  alt={user.username}
                  className="w-7 h-7 rounded-full border border-white/30 object-cover"
                />
                <span className="hidden sm:inline text-xs font-bold text-white max-w-24 truncate">{user.username}</span>
                {user.stats && (
                  <span className="hidden sm:inline text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-400/20">
                    Lv.{user.stats.level}
                  </span>
                )}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                onClick={() => { logout(); router.push('/'); }}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-white/60 hover:text-red-400" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" glow onClick={() => router.push('/register')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { useSounds } from '../../../hooks/useSounds';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();
  const { playClick, playError } = useSounds();
  const router = useRouter();
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      playClick();
      await register(email, username, password);
      router.push('/lobby');
    } catch (err: unknown) {
      playError();
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };
  
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background ambient orbs */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-6">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 via-amber-400 to-emerald-500 rounded-3xl mb-4 shadow-xl shadow-red-500/20 border-2 border-white/20 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <span className="font-black italic text-white text-3xl tracking-tighter drop-shadow-md">UNO</span>
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">Create Account</h1>
          <p className="text-white/50 text-xs mt-1">Join the competitive UNO multiplayer arena</p>
        </div>
        
        <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl px-4 py-2.5 text-xs mb-4 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  placeholder="coolplayer123"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 placeholder-white/20 text-sm transition-all shadow-inner"
                />
              </div>
            </div>
            
            <div>
              <label className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 placeholder-white/20 text-sm transition-all shadow-inner"
                />
              </div>
            </div>
            
            <div>
              <label className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 placeholder-white/20 text-sm transition-all shadow-inner"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full font-bold text-base h-11 shadow-lg shadow-indigo-600/30"
              glow
              loading={isLoading}
            >
              Start Playing
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
          
          <p className="text-center text-white/50 text-xs mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

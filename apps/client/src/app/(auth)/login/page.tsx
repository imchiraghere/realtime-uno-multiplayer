'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { useSounds } from '../../../hooks/useSounds';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loginAsGuest, isLoading } = useAuth();
  const { playClick, playError } = useSounds();
  const router = useRouter();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      playClick();
      await login(email, password);
      router.push('/lobby');
    } catch (err: unknown) {
      playError();
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    }
  };
  
  const handleGuest = async () => {
    try {
      playClick();
      await loginAsGuest();
      router.push('/lobby');
    } catch (err: unknown) {
      playError();
      setError(err instanceof Error ? err.message : 'Guest login failed');
    }
  };
  
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background ambient orbs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 via-amber-400 to-emerald-500 rounded-3xl mb-4 shadow-xl shadow-red-500/20 border-2 border-white/20 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <span className="font-black italic text-white text-3xl tracking-tighter drop-shadow-md">UNO</span>
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-white/50 text-xs mt-1">Sign in to join rooms and climb the ladder</p>
        </div>
        
        {/* Glass Card */}
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
          
          <form onSubmit={handleLogin} className="space-y-4">
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 placeholder-white/20 text-sm transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full font-bold text-base h-11 shadow-lg shadow-indigo-600/30"
              glow
              loading={isLoading}
            >
              Sign In
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900 px-3 text-white/40 text-[11px] uppercase tracking-wider font-semibold">
                or
              </span>
            </div>
          </div>
          
          <Button
            variant="secondary"
            className="w-full h-11 flex items-center justify-center gap-2 font-semibold"
            onClick={handleGuest}
          >
            <UserCheck className="w-4 h-4 text-indigo-400" />
            Play Instantly as Guest
          </Button>
          
          <p className="text-center text-white/50 text-xs mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              Sign Up Free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

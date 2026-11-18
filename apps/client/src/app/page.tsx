'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/Button';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useSounds } from '../hooks/useSounds';
import { Users, Trophy, Zap, Bot, ArrowRight, Star, Sparkles, ShieldCheck, Flame } from 'lucide-react';
import { UnoCard } from '../components/cards/UnoCard';
import { UnoCard as UnoCardType } from '../types/game';

// Sample cards for floating background
const SAMPLE_CARDS: UnoCardType[] = [
  { id: 'sample-1', color: 'red', value: '7' },
  { id: 'sample-2', color: 'blue', value: 'skip' },
  { id: 'sample-3', color: 'green', value: 'reverse' },
  { id: 'sample-4', color: 'yellow', value: 'draw_two' },
  { id: 'sample-5', color: 'wild', value: 'wild' },
  { id: 'sample-6', color: 'red', value: '3' },
  { id: 'sample-7', color: 'blue', value: '9' },
  { id: 'sample-8', color: 'green', value: '5' },
  { id: 'sample-9', color: 'yellow', value: 'skip' },
  { id: 'sample-10', color: 'wild', value: 'wild_draw_four' },
];

const SHOWCASE_CARDS: UnoCardType[] = [
  { id: 'hero-1', color: 'red', value: '7' },
  { id: 'hero-2', color: 'blue', value: 'skip' },
  { id: 'hero-3', color: 'wild', value: 'wild_draw_four' },
  { id: 'hero-4', color: 'yellow', value: 'reverse' },
  { id: 'hero-5', color: 'green', value: 'draw_two' },
];

const CARD_ROTATIONS = [-16, 12, -8, 20, -14, 18, -22, 10, -6, 15];
const CARD_DURATIONS = [6.5, 7.8, 8.2, 6.9, 7.4, 8.0, 6.2, 8.6, 7.1, 7.5];

function FloatingCard({ card, index, delay, x, y }: { card: UnoCardType; index: number; delay: number; x: number; y: number }) {
  const rot = CARD_ROTATIONS[index % CARD_ROTATIONS.length];
  const dur = CARD_DURATIONS[index % CARD_DURATIONS.length];
  return (
    <motion.div
      className="absolute pointer-events-none select-none opacity-25 hover:opacity-40 transition-opacity"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, rotate: rot, scale: 0.6 }}
      animate={{
        opacity: [0.15, 0.35, 0.2, 0.35],
        y: [0, -24, 0, -12, 0],
        rotate: [rot - 3, rot + 3],
      }}
      transition={{
        duration: dur,
        delay,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      <UnoCard card={card} size="sm" disabled />
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, loginAsGuest } = useAuth();
  const { playClick, playCardPlay } = useSounds();
  const [mounted, setMounted] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handlePlayNow = async () => {
    playClick();
    if (isAuthenticated) {
      router.push('/lobby');
    } else {
      try {
        await loginAsGuest();
        router.push('/lobby');
      } catch {
        router.push('/login');
      }
    }
  };
  
  const stats = [
    { label: 'Active Players', value: '1,420+', icon: '🟢', highlight: 'text-emerald-400' },
    { label: 'Matches Today', value: '9,840+', icon: '🎮', highlight: 'text-indigo-400' },
    { label: 'Global Ladder', value: '100% Free', icon: '🏆', highlight: 'text-yellow-400' },
  ];
  
  const features = [
    {
      icon: <Users className="w-6 h-6 text-indigo-400" />,
      title: 'Real-Time Multiplayer',
      desc: 'Seamless WebSockets with 2-4 players and auto-reconnect.',
      accent: 'border-indigo-500/20 hover:border-indigo-500/50',
    },
    {
      icon: <Bot className="w-6 h-6 text-purple-400" />,
      title: 'Smart AI Bots',
      desc: 'Practice anytime against adaptive AI opponents.',
      accent: 'border-purple-500/20 hover:border-purple-500/50',
    },
    {
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
      title: 'Competitive Ladder',
      desc: 'Climb the global rating leaderboard with match history.',
      accent: 'border-yellow-500/20 hover:border-yellow-500/50',
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: 'Quick Match',
      desc: 'Jump into a lobby instantly without waiting.',
      accent: 'border-amber-500/20 hover:border-amber-500/50',
    },
  ];
  
  return (
    <div className="min-h-screen bg-hero-gradient relative overflow-hidden selection:bg-indigo-500/30">
      <Navbar />
      
      {/* Floating cards background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && SAMPLE_CARDS.map((card, i) => (
          <FloatingCard
            key={card.id}
            card={card}
            index={i}
            delay={i * 0.4}
            x={4 + (i * 10) % 92}
            y={8 + (i * 14) % 84}
          />
        ))}
      </div>
      
      {/* Radiant ambient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-uno-dark/60 via-transparent to-uno-dark pointer-events-none" />
      
      {/* Hero content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-32 pb-24 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md shadow-lg shadow-indigo-500/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 animate-pulse" />
          <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">
            Real-Time Multiplayer Card Arena
          </span>
        </motion.div>
        
        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tight"
        >
          The Ultimate Online{' '}
          <span className="bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
            UNO
          </span>{' '}
          Experience
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Play the world&apos;s favorite card game with friends or battle against smart AI. Enjoy authentic cards, smooth physics, and interactive turn timers.
        </motion.p>
        
        {/* Interactive Showcase Card Hand */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="relative max-w-md mx-auto h-40 mb-12 flex items-center justify-center select-none"
        >
          <div className="flex items-center justify-center -space-x-8">
            {SHOWCASE_CARDS.map((card, idx) => {
              const rot = (idx - 2) * 8;
              const yOffset = Math.abs(idx - 2) * 8;
              const isHovered = hoveredCardId === card.id;

              return (
                <motion.div
                  key={card.id}
                  style={{ zIndex: isHovered ? 30 : idx + 10 }}
                  animate={{
                    y: isHovered ? -24 : yOffset,
                    rotate: isHovered ? 0 : rot,
                    scale: isHovered ? 1.15 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onMouseEnter={() => {
                    setHoveredCardId(card.id);
                    playCardPlay();
                  }}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className="cursor-pointer drop-shadow-2xl filter"
                >
                  <UnoCard card={card} size="md" />
                </motion.div>
              );
            })}
          </div>
          <div className="absolute -bottom-2 text-[11px] text-white/35 font-medium tracking-wide">
            Hover cards to test the deck
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Button
            size="xl"
            glow
            onClick={handlePlayNow}
            className="text-lg font-black px-8 h-14 shadow-2xl shadow-indigo-600/40"
          >
            <Flame className="w-5 h-5 text-amber-300" />
            Play Free Now
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>

          <Button
            size="xl"
            variant="secondary"
            onClick={() => {
              playClick();
              router.push('/login');
            }}
            className="text-lg font-bold px-7 h-14"
          >
            <Users className="w-5 h-5 text-indigo-400 mr-1" />
            Sign In / Register
          </Button>
        </motion.div>
        
        {/* Live Platform Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-20 p-4 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-xl"
        >
          {stats.map(({ label, value, icon, highlight }) => (
            <div key={label} className="text-center p-2">
              <div className="text-xl mb-1">{icon}</div>
              <div className={`font-black text-lg ${highlight}`}>{value}</div>
              <div className="text-white/40 text-[11px] font-medium">{label}</div>
            </div>
          ))}
        </motion.div>
        
        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
          {features.map(({ icon, title, desc, accent }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className={`bg-slate-900/50 backdrop-blur-md border ${accent} rounded-2xl p-5 hover:bg-slate-900/80 transition-all duration-200 hover:-translate-y-1 shadow-lg group`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                {icon}
              </div>
              <div className="text-white font-bold text-base mb-1">{title}</div>
              <div className="text-white/50 text-xs leading-relaxed">{desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

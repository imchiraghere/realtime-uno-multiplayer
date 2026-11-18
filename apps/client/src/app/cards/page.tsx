'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../../components/layout/Navbar';
import { UnoCard } from '../../components/cards/UnoCard';
import { CardBack } from '../../components/cards/CardBack';
import { UnoCard as UnoCardType, CardColor } from '../../types/game';
import { useSounds } from '../../hooks/useSounds';
import { Sparkles, Layers, ShieldCheck, Flame, RotateCw, CheckCircle2, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface CardCatalogItem {
  id: string;
  card: UnoCardType;
  color: CardColor;
  valueName: string;
  countInDeck: number;
  points: number;
  description: string;
}

const COLORS: CardColor[] = ['red', 'green', 'blue', 'yellow'];

function generateCatalog(): CardCatalogItem[] {
  const items: CardCatalogItem[] = [];

  // 1. Color Number Cards: 0 (1 per color), 1-9 (2 per color)
  for (const color of COLORS) {
    // Zero
    items.push({
      id: `${color}-0`,
      card: { id: `${color}-0`, color, value: '0' },
      color,
      valueName: `${color.toUpperCase()} 0`,
      countInDeck: 1,
      points: 0,
      description: 'Face value 0. Only 1 per color (4 total in deck).',
    });

    // 1 to 9
    for (let num = 1; num <= 9; num++) {
      items.push({
        id: `${color}-${num}`,
        card: { id: `${color}-${num}`, color, value: `${num}` as UnoCardType['value'] },
        color,
        valueName: `${color.toUpperCase()} ${num}`,
        countInDeck: 2,
        points: num,
        description: `Face value ${num}. 2 copies per color (8 total per digit across deck).`,
      });
    }

    // 2. Action Cards
    items.push({
      id: `${color}-skip`,
      card: { id: `${color}-skip`, color, value: 'skip' },
      color,
      valueName: `${color.toUpperCase()} Skip (⊘)`,
      countInDeck: 2,
      points: 20,
      description: 'Skips the next player\'s turn. In 2-player mode, gives you another turn.',
    });

    items.push({
      id: `${color}-reverse`,
      card: { id: `${color}-reverse`, color, value: 'reverse' },
      color,
      valueName: `${color.toUpperCase()} Reverse (⇄)`,
      countInDeck: 2,
      points: 20,
      description: 'Reverses turn order (CW ⇄ CCW). In 2-player mode, acts like a Skip.',
    });

    items.push({
      id: `${color}-draw_two`,
      card: { id: `${color}-draw_two`, color, value: 'draw_two' },
      color,
      valueName: `${color.toUpperCase()} Draw Two (+2)`,
      countInDeck: 2,
      points: 20,
      description: 'Forces next player to draw 2 cards and forfeit their turn.',
    });
  }

  // 3. Wild Cards
  items.push({
    id: 'wild-regular',
    card: { id: 'wild-regular', color: 'wild', value: 'wild' },
    color: 'wild',
    valueName: 'Wild (Color Choice)',
    countInDeck: 4,
    points: 50,
    description: 'Playable on any card. Chooses the active color for the next player.',
  });

  items.push({
    id: 'wild-draw-four',
    card: { id: 'wild-draw-four', color: 'wild', value: 'wild_draw_four' },
    color: 'wild',
    valueName: 'Wild Draw Four (+4)',
    countInDeck: 4,
    points: 50,
    description: 'Playable on any card. Changes color and forces next player to draw 4 cards! Subject to challenge if played as a bluff.',
  });

  items.push({
    id: 'wild-shuffle',
    card: { id: 'wild-shuffle', color: 'wild', value: 'wild_shuffle' },
    color: 'wild',
    valueName: 'Wild Shuffle Hands',
    countInDeck: 2,
    points: 50,
    description: 'Playable on any card. Collects all cards from every player\'s hand, shuffles them together, deals them back out starting from the next player, and lets you choose the color!',
  });

  return items;
}

const CATALOG = generateCatalog();

export default function CardsShowcasePage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | CardColor | 'actions' | 'cardback'>('all');
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [activePreviewCard, setActivePreviewCard] = useState<CardCatalogItem>(CATALOG[0]);
  const { playClick, playCardPlay } = useSounds();

  const filteredItems = CATALOG.filter(item => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'actions') {
      return ['skip', 'reverse', 'draw_two', 'wild', 'wild_draw_four', 'wild_shuffle'].includes(item.card.value);
    }
    return item.color === selectedFilter;
  });

  const totalCardsInDeck = 110; // 19 Red + 19 Blue + 19 Green + 19 Yellow + 24 Actions + 8 Regular Wilds + 2 Wild Shuffle Hands = 110

  return (
    <div className="min-h-screen bg-hero-gradient selection:bg-indigo-500/30">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full 108-Card Official Deck</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              UNO Card Compendium
            </h1>
            <p className="text-white/50 text-sm mt-1 max-w-xl">
              Inspect all 108 cards included in our real-time multiplayer deck: 100 color cards, 8 wild cards, and the authentic UNO card back.
            </p>
          </div>

          {/* Quick Deck Stats Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-white/10 text-center">
              <div className="text-xl font-black font-mono text-white">110</div>
              <div className="text-[10px] uppercase font-bold text-white/40">Total Cards</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-white/10 text-center">
              <div className="text-xl font-black font-mono text-emerald-400">4</div>
              <div className="text-[10px] uppercase font-bold text-white/40">Colors</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-white/10 text-center">
              <div className="text-xl font-black font-mono text-purple-400">10</div>
              <div className="text-[10px] uppercase font-bold text-white/40">Wilds (+4 & 🔀)</div>
            </div>
          </div>
        </motion.div>

        {/* Selected Card Spotlight Panel */}
        <div className="mb-10 p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-8">
          {/* Card interactive 3D preview */}
          <div className="flex flex-col items-center">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playCardPlay();
                setFlippedCardId(flippedCardId === activePreviewCard.id ? null : activePreviewCard.id);
              }}
              className="cursor-pointer drop-shadow-2xl filter"
            >
              {flippedCardId === activePreviewCard.id ? (
                <CardBack size="lg" />
              ) : (
                <UnoCard card={activePreviewCard.card} size="lg" />
              )}
            </motion.div>
            <span className="text-[11px] text-white/40 mt-3 flex items-center gap-1 font-medium">
              <RotateCw className="w-3 h-3 text-indigo-400" />
              Click card to flip
            </span>
          </div>

          {/* Card Info details */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {activePreviewCard.color.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white/70">
                {activePreviewCard.countInDeck} in Deck
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activePreviewCard.points} Points
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              {activePreviewCard.valueName}
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-4 max-w-2xl">
              {activePreviewCard.description}
            </p>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-white/50">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Playing this card in game automatically triggers sound effects, turn animations, and matching validations.
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {[
            { id: 'all' as const, label: 'All Cards (56 Types)', count: 56 },
            { id: 'red' as const, label: 'Red (13 Types)', colorClass: 'text-red-400' },
            { id: 'green' as const, label: 'Green (13 Types)', colorClass: 'text-green-400' },
            { id: 'blue' as const, label: 'Blue (13 Types)', colorClass: 'text-blue-400' },
            { id: 'yellow' as const, label: 'Yellow (13 Types)', colorClass: 'text-yellow-400' },
            { id: 'wild' as const, label: 'Wild (+4 & Choice)', colorClass: 'text-purple-400' },
            { id: 'actions' as const, label: 'Actions Only (Skip, Rev, +2, +4)' },
            { id: 'cardback' as const, label: 'Card Back' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                playClick();
                setSelectedFilter(tab.id);
              }}
              className={clsx(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all border',
                selectedFilter === tab.id
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/60 border-white/10 text-white/60 hover:text-white hover:bg-slate-900'
              )}
            >
              <span className={tab.colorClass}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Catalog Grid View */}
        {selectedFilter === 'cardback' ? (
          <div className="py-12 flex flex-col items-center justify-center bg-slate-900/40 rounded-3xl border border-white/10 p-8">
            <CardBack size="lg" />
            <h3 className="text-xl font-black text-white mt-6 mb-1">Official UNO Card Back</h3>
            <p className="text-white/50 text-xs text-center max-w-md">
              Features a deep obsidian card stock, concentric white borders, tilted crimson oval, and the signature yellow italic UNO emblem. Used for opponent hands, deck piles, and hidden card animations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => {
                const isSelected = activePreviewCard.id === item.id;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -6 }}
                    onClick={() => {
                      playClick();
                      setActivePreviewCard(item);
                      setFlippedCardId(null);
                    }}
                    className={clsx(
                      'p-3 rounded-2xl border flex flex-col items-center cursor-pointer transition-all duration-200 group',
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-400/40 shadow-xl'
                        : 'bg-slate-900/50 border-white/10 hover:border-white/30 hover:bg-slate-900/80'
                    )}
                  >
                    <div className="mb-2.5">
                      <UnoCard card={item.card} size="sm" />
                    </div>

                    <div className="text-center w-full">
                      <div className="text-[11px] font-bold text-white truncate group-hover:text-indigo-300">
                        {item.card.value.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-[10px] text-white/40 mt-0.5 flex items-center justify-center gap-1.5 font-mono">
                        <span>×{item.countInDeck}</span>
                        <span>•</span>
                        <span>{item.points}pt</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Deck Composition Guide Table */}
        <div className="mt-16 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Deck Composition Breakdown
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/70">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold text-white/40 uppercase tracking-wider">
                  <th className="py-3 px-4">Card Category</th>
                  <th className="py-3 px-4">Values & Types</th>
                  <th className="py-3 px-4">Copies Per Color</th>
                  <th className="py-3 px-4">Total Cards</th>
                  <th className="py-3 px-4">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                <tr>
                  <td className="py-3.5 px-4 font-sans font-bold text-white">Zero Cards</td>
                  <td className="py-3.5 px-4">0 (Red, Blue, Green, Yellow)</td>
                  <td className="py-3.5 px-4">1 copy</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">4 cards</td>
                  <td className="py-3.5 px-4">0 pts</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-bold text-white">Number Cards</td>
                  <td className="py-3.5 px-4">1 through 9 (Each Color)</td>
                  <td className="py-3.5 px-4">2 copies each</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">72 cards</td>
                  <td className="py-3.5 px-4">1–9 pts</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-bold text-white">Action Cards</td>
                  <td className="py-3.5 px-4">Skip (⊘), Reverse (⇄), Draw Two (+2)</td>
                  <td className="py-3.5 px-4">2 copies each</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">24 cards</td>
                  <td className="py-3.5 px-4">20 pts each</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-bold text-white">Wild Cards</td>
                  <td className="py-3.5 px-4">Wild (Color Choice)</td>
                  <td className="py-3.5 px-4">—</td>
                  <td className="py-3.5 px-4 text-purple-400 font-bold">4 cards</td>
                  <td className="py-3.5 px-4">50 pts each</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-bold text-white">Wild Draw Four</td>
                  <td className="py-3.5 px-4">Wild Draw Four (+4)</td>
                  <td className="py-3.5 px-4">—</td>
                  <td className="py-3.5 px-4 text-purple-400 font-bold">4 cards</td>
                  <td className="py-3.5 px-4">50 pts each</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-sans font-bold text-white">Wild Shuffle Hands</td>
                  <td className="py-3.5 px-4">Wild Shuffle Hands (🔀)</td>
                  <td className="py-3.5 px-4">—</td>
                  <td className="py-3.5 px-4 text-purple-400 font-bold">2 cards</td>
                  <td className="py-3.5 px-4">50 pts each</td>
                </tr>
                <tr className="bg-white/5 font-bold text-white">
                  <td className="py-4 px-4 font-sans">Full Deck Sum</td>
                  <td className="py-4 px-4">Complete UNO Callset</td>
                  <td className="py-4 px-4">4 Colors + 10 Wilds</td>
                  <td className="py-4 px-4 text-indigo-400 text-sm">110 Cards Total</td>
                  <td className="py-4 px-4">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

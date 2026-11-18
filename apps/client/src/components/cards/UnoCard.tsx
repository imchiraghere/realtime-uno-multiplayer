'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { UnoCard as UnoCardType, CardColor } from '../../types/game';

interface UnoCardProps {
  card: UnoCardType;
  onClick?: () => void;
  selected?: boolean;
  playable?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  activeColor?: CardColor;
}

const COLOR_CONFIG: Record<CardColor, {
  bg: string;
  text: string;
  shadow: string;
  badgeBg: string;
}> = {
  red: {
    bg: 'from-red-600 via-red-500 to-red-700',
    text: 'text-red-600',
    shadow: 'shadow-red-500/50',
    badgeBg: 'bg-red-500',
  },
  green: {
    bg: 'from-emerald-600 via-green-500 to-green-700',
    text: 'text-green-600',
    shadow: 'shadow-green-500/50',
    badgeBg: 'bg-green-500',
  },
  blue: {
    bg: 'from-blue-600 via-blue-500 to-blue-700',
    text: 'text-blue-600',
    shadow: 'shadow-blue-500/50',
    badgeBg: 'bg-blue-500',
  },
  yellow: {
    bg: 'from-amber-400 via-yellow-400 to-amber-500',
    text: 'text-amber-500',
    shadow: 'shadow-yellow-400/50',
    badgeBg: 'bg-yellow-400',
  },
  wild: {
    bg: 'from-zinc-900 via-neutral-800 to-zinc-950',
    text: 'text-white',
    shadow: 'shadow-purple-500/50',
    badgeBg: 'bg-purple-600',
  },
};

const VALUE_DISPLAY: Record<string, string> = {
  skip: '⊘',
  reverse: '⇄',
  draw_two: '+2',
  wild: 'WILD',
  wild_draw_four: '+4',
  wild_shuffle: 'SHUFFLE',
};

const SIZES = {
  xs: {
    card: 'w-10 h-14',
    border: 'border-2',
    corner: 'text-[9px]',
    centerText: 'text-xs',
    oval: 'w-[86%] h-[74%]',
    wildWheel: 'w-5 h-5',
    wildBadge: 'text-[7px]',
  },
  sm: {
    card: 'w-14 h-20',
    border: 'border-[3px]',
    corner: 'text-xs',
    centerText: 'text-base',
    oval: 'w-[86%] h-[74%]',
    wildWheel: 'w-8 h-8',
    wildBadge: 'text-[9px]',
  },
  md: {
    card: 'w-20 h-28',
    border: 'border-4',
    corner: 'text-sm',
    centerText: 'text-2xl',
    oval: 'w-[86%] h-[74%]',
    wildWheel: 'w-11 h-11',
    wildBadge: 'text-xs',
  },
  lg: {
    card: 'w-28 h-40',
    border: 'border-4',
    corner: 'text-base',
    centerText: 'text-4xl',
    oval: 'w-[86%] h-[74%]',
    wildWheel: 'w-16 h-16',
    wildBadge: 'text-sm',
  },
};

/**
 * Dedicated vector icon for the corners of Wild Shuffle cards
 */
function ShuffleCornerIcon({ size }: { size: 'xs' | 'sm' | 'md' | 'lg' }) {
  const iconDimensions = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={clsx(iconDimensions, 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]')}
    >
      {/* Top golden arrow curving down-right */}
      <path
        d="M3 5 H 6 C 8.5 5, 11 15, 14 15 H 17"
        stroke="#facc15"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M14.5 12 L 17.5 15 L 14.5 18"
        stroke="#facc15"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom white arrow curving up-right */}
      <path
        d="M3 15 H 6 C 7.2 15, 8.5 12.5, 9.7 10"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M10.8 7.8 C 12 5.5, 13 5, 14 5 H 17"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M14.5 2 L 17.5 5 L 14.5 8"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Premium Wild Shuffle center artwork with 4-color segmented ring,
 * miniature overlapping cards, energetic crossing arrows, and golden SHUFFLE ribbon.
 */
function WildShuffleCenter({ size }: { size: 'xs' | 'sm' | 'md' | 'lg' }) {
  const wheelDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size];

  const badgeClasses = {
    xs: 'text-[5px] px-1 py-0 -bottom-1 tracking-wider',
    sm: 'text-[7px] px-1.5 py-0.5 -bottom-1.5 tracking-wider',
    md: 'text-[9px] px-2 py-0.5 -bottom-2 tracking-widest font-black',
    lg: 'text-xs px-2.5 py-0.5 -bottom-2.5 tracking-widest font-black',
  }[size];

  return (
    <div className="relative flex flex-col items-center justify-center rotate-[20deg] pointer-events-none">
      {/* 4-Color Outer Ring */}
      <div
        className={clsx(
          wheelDimensions,
          'relative rounded-full p-[2px] shadow-[0_2px_8px_rgba(0,0,0,0.6)] flex items-center justify-center'
        )}
      >
        {/* Quad color segments */}
        <div className="absolute inset-0 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border border-white/60">
          <div className="bg-red-500" />
          <div className="bg-blue-500" />
          <div className="bg-amber-400" />
          <div className="bg-emerald-500" />
        </div>

        {/* Inner Obsidian & Violet Core */}
        <div className="relative z-10 w-[78%] h-[78%] rounded-full bg-gradient-to-br from-neutral-900 via-indigo-950 to-neutral-950 border border-white/40 flex items-center justify-center shadow-inner overflow-hidden">
          {/* Subtle radial sheen */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,180,254,0.4)_0%,transparent_75%)]" />

          {/* Detailed SVG Illustration: Two fan-shuffled cards & swirling arrows */}
          <svg
            viewBox="0 0 36 36"
            className="w-[84%] h-[84%] relative z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
            fill="none"
          >
            {/* Back tilted card (Blue) */}
            <rect
              x="8"
              y="7"
              width="12"
              height="17"
              rx="2"
              transform="rotate(-18 14 15.5)"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="1.2"
            />
            {/* Front tilted card (Red) */}
            <rect
              x="16"
              y="7"
              width="12"
              height="17"
              rx="2"
              transform="rotate(18 22 15.5)"
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth="1.2"
            />

            {/* Dynamic Swirling Crossing Arrows */}
            {/* Upper Arrow: curving from left card down to right */}
            <path
              d="M7 17 C 11 11, 21 11, 26 16"
              stroke="#facc15"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <polygon
              points="23,13 28,16.5 24,19.5"
              fill="#facc15"
            />

            {/* Lower Arrow: curving from right card back up to left */}
            <path
              d="M29 19 C 25 25, 15 25, 10 20"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <polygon
              points="13,23 8,19.5 12,16.5"
              fill="#38bdf8"
            />

            {/* Center spark / burst */}
            <circle cx="18" cy="18" r="1.5" fill="#ffffff" />
          </svg>
        </div>
      </div>

      {/* Ribbon Banner: "SHUFFLE" */}
      <div
        className={clsx(
          badgeClasses,
          'absolute z-20 flex items-center justify-center font-black uppercase text-neutral-950 rounded-full',
          'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_2px_4px_rgba(0,0,0,0.6)] border border-yellow-200/80'
        )}
      >
        SHUFFLE
      </div>
    </div>
  );
}

export function UnoCard({
  card,
  onClick,
  selected,
  playable,
  size = 'md',
  className,
  disabled,
  activeColor,
}: UnoCardProps) {
  const colorKey: CardColor = card?.color && COLOR_CONFIG[card.color] ? card.color : 'wild';
  const cfg = COLOR_CONFIG[colorKey];
  const sizeStyle = SIZES[size] || SIZES.md;
  const displayValue = VALUE_DISPLAY[card?.value] ?? card?.value ?? '';

  const isWild = card?.value === 'wild';
  const isWildDrawFour = card?.value === 'wild_draw_four';
  const isWildShuffle = card?.value === 'wild_shuffle';

  // Wild Shuffle card background is an ultraviolet / cosmic indigo gradient with a neon-purple glow
  const cardBg = isWildShuffle
    ? 'from-indigo-950 via-purple-900 to-neutral-950'
    : cfg.bg;
  const cardShadow = isWildShuffle
    ? 'shadow-purple-600/50'
    : cfg.shadow;

  // Active color highlight for wild cards in discard pile
  const activeColorCfg = activeColor && COLOR_CONFIG[activeColor] ? COLOR_CONFIG[activeColor] : null;

  return (
    <motion.div
      whileHover={playable && !disabled ? { y: -16, scale: 1.06 } : undefined}
      whileTap={playable && !disabled ? { scale: 0.95 } : undefined}
      animate={selected ? { y: -20, scale: 1.1 } : undefined}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={disabled ? undefined : onClick}
      className={clsx(
        sizeStyle.card,
        'relative rounded-2xl select-none flex-shrink-0',
        'border-white',
        sizeStyle.border,
        'bg-gradient-to-br',
        cardBg,
        'shadow-md',
        selected && `shadow-2xl ${cardShadow} ring-4 ring-white`,
        playable && !disabled && `cursor-pointer hover:shadow-xl ${cardShadow} ring-2 ring-white/70`,
        !playable && !selected && !disabled && 'cursor-pointer hover:brightness-105',
        disabled && 'pointer-events-none',
        className
      )}
    >
      {/* Shine gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 rounded-2xl pointer-events-none" />

      {/* Cosmic background effects for Wild Shuffle */}
      {isWildShuffle && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-purple-500/30 rounded-full blur-xl" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-indigo-500/30 rounded-full blur-xl" />
          <svg className="w-full h-full opacity-20" viewBox="0 0 100 140" fill="none">
            <circle cx="50" cy="70" r="45" stroke="white" strokeWidth="1" strokeDasharray="3 6" />
            <circle cx="50" cy="70" r="30" stroke="white" strokeWidth="0.75" strokeDasharray="4 8" />
          </svg>
        </div>
      )}

      {/* Center tilted oval */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className={clsx(
            sizeStyle.oval,
            '-rotate-[20deg] rounded-[50%] flex items-center justify-center shadow-inner relative',
            isWildShuffle
              ? 'bg-neutral-950 border-2 border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : isWild || isWildDrawFour
              ? 'bg-neutral-900 border border-white/20'
              : 'bg-white'
          )}
        >
          {/* Inner symbol / number */}
          {isWild ? (
            <div className={clsx(sizeStyle.wildWheel, 'rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border-2 border-white shadow-md')}>
              <div className="bg-red-500" />
              <div className="bg-blue-500" />
              <div className="bg-yellow-400" />
              <div className="bg-green-500" />
            </div>
          ) : isWildDrawFour ? (
            <div className="relative flex items-center justify-center">
              <div className={clsx(sizeStyle.wildWheel, 'rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 border-2 border-white shadow-md opacity-85')}>
                <div className="bg-red-500" />
                <div className="bg-blue-500" />
                <div className="bg-yellow-400" />
                <div className="bg-green-500" />
              </div>
              <span className={clsx(sizeStyle.centerText, 'absolute font-black text-white italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]')}>
                +4
              </span>
            </div>
          ) : isWildShuffle ? (
            <WildShuffleCenter size={size} />
          ) : (
            <span
              className={clsx(
                sizeStyle.centerText,
                'font-black italic drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]',
                cfg.text,
                'transform rotate-[20deg]'
              )}
            >
              {displayValue}
            </span>
          )}
        </div>
      </div>

      {/* Top-left corner value */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none pointer-events-none">
        {isWildShuffle ? (
          <div className="flex flex-col items-center gap-0.5">
            <ShuffleCornerIcon size={size} />
            <span
              className={clsx(
                'font-black text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] tracking-tighter uppercase scale-90',
                size === 'xs' ? 'text-[5px]' : size === 'sm' ? 'text-[6px]' : 'text-[7px]'
              )}
            >
              WILD
            </span>
          </div>
        ) : (
          <span
            className={clsx(
              sizeStyle.corner,
              'font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-tight'
            )}
          >
            {displayValue}
          </span>
        )}
      </div>

      {/* Bottom-right corner value (inverted) */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none pointer-events-none rotate-180">
        {isWildShuffle ? (
          <div className="flex flex-col items-center gap-0.5">
            <ShuffleCornerIcon size={size} />
            <span
              className={clsx(
                'font-black text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] tracking-tighter uppercase scale-90',
                size === 'xs' ? 'text-[5px]' : size === 'sm' ? 'text-[6px]' : 'text-[7px]'
              )}
            >
              WILD
            </span>
          </div>
        ) : (
          <span
            className={clsx(
              sizeStyle.corner,
              'font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-tight'
            )}
          >
            {displayValue}
          </span>
        )}
      </div>

      {/* Active color badge for wild discard pile card */}
      {activeColorCfg && (isWild || isWildDrawFour || isWildShuffle) && (
        <div className="absolute -bottom-2 inset-x-0 flex justify-center pointer-events-none">
          <span className={clsx(
            'text-[9px] font-bold px-2 py-0.5 rounded-full text-white shadow-lg uppercase tracking-wider border border-white/60',
            activeColorCfg.badgeBg
          )}>
            {activeColor}
          </span>
        </div>
      )}

      {/* Playable pulse indicator border */}
      {playable && !selected && !disabled && (
        <div className="absolute -inset-0.5 rounded-2xl border-2 border-white/90 animate-pulse pointer-events-none" />
      )}
    </motion.div>
  );
}

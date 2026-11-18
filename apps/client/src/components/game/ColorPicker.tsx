'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CardColor } from '../../types/game';

interface ColorPickerProps {
  isOpen: boolean;
  onColorSelected: (color: CardColor) => void;
  onClose?: () => void;
}

const COLOR_SECTORS: {
  color: CardColor;
  label: string;
  bg: string;
  glow: string;
  border: string;
  textColor: string;
}[] = [
  {
    color: 'red',
    label: 'RED',
    bg: 'from-red-600 to-red-500',
    glow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]',
    border: 'border-red-400',
    textColor: 'text-white',
  },
  {
    color: 'blue',
    label: 'BLUE',
    bg: 'from-blue-600 to-blue-500',
    glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.8)]',
    border: 'border-blue-400',
    textColor: 'text-white',
  },
  {
    color: 'yellow',
    label: 'YELLOW',
    bg: 'from-amber-400 to-yellow-400',
    glow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.8)]',
    border: 'border-yellow-200',
    textColor: 'text-neutral-900',
  },
  {
    color: 'green',
    label: 'GREEN',
    bg: 'from-emerald-600 to-green-500',
    glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.8)]',
    border: 'border-green-400',
    textColor: 'text-white',
  },
];

export function ColorPicker({ isOpen, onColorSelected, onClose }: ColorPickerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && onClose) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.6, y: 30, rotate: -10 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.6, y: 30, rotate: 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-neutral-950/90 border-2 border-white/20 rounded-3xl p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center max-w-sm w-full"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-wider mb-2">
              <span>★ Wild Action</span>
            </div>
            <h3 className="text-white text-2xl sm:text-3xl font-black mb-6 tracking-tight">
              Pick Next Color
            </h3>

            {/* Circular 4-quadrant Color Wheel */}
            <div className="relative w-56 h-56 rounded-full overflow-hidden p-2 bg-black/60 border-4 border-white/30 shadow-2xl grid grid-cols-2 grid-rows-2 gap-2">
              {COLOR_SECTORS.map(({ color, label, bg, glow, border, textColor }) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.06, zIndex: 10 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onColorSelected(color)}
                  className={`relative flex items-center justify-center bg-gradient-to-br ${bg} ${glow} ${border} border-2 rounded-2xl cursor-pointer transition-all duration-200 select-none group`}
                >
                  <span className={`font-black text-sm tracking-wider ${textColor} drop-shadow-md group-hover:scale-110 transition-transform`}>
                    {label}
                  </span>
                </motion.button>
              ))}

              {/* Center UNO Orb */}
              <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/80 border-2 border-white/40 shadow-xl flex items-center justify-center pointer-events-none">
                <span className="font-black italic text-yellow-300 text-xs tracking-wider">
                  UNO
                </span>
              </div>
            </div>

            <p className="text-white/40 text-xs mt-6">
              Choose the color that the next player must match.
            </p>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="mt-4 text-xs font-semibold text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                Cancel Selection
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

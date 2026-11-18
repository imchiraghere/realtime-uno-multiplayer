'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnoCard } from './UnoCard';
import { UnoCard as UnoCardType, CardColor } from '../../types/game';
import { clsx } from 'clsx';

interface CardHandProps {
  cards: UnoCardType[];
  onCardClick?: (card: UnoCardType) => void;
  selectedCardId?: string | null;
  currentColor?: CardColor;
  currentValue?: string;
  isMyTurn?: boolean;
  gameMode?: string;
  className?: string;
}

function isCardPlayable(card: UnoCardType, currentColor?: CardColor, currentValue?: string): boolean {
  if (!currentColor) return false;
  if (card.value === 'wild' || card.value === 'wild_draw_four' || card.value === 'wild_shuffle') return true;
  if (card.color === currentColor) return true;
  if (currentValue && card.value === currentValue) return true;
  return false;
}

export function CardHand({
  cards = [],
  onCardClick,
  selectedCardId,
  currentColor,
  currentValue,
  isMyTurn,
  className,
}: CardHandProps) {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const cardWidth = 80; // px for size md
  const maxHandWidth = 760; // px
  const count = cards.length;
  const spacing = count > 1
    ? Math.min(50, Math.max(26, (maxHandWidth - cardWidth) / (count - 1)))
    : 0;
  const totalWidth = count > 1 ? cardWidth + (count - 1) * spacing : cardWidth;

  return (
    <div className={clsx('flex items-end justify-center px-4 py-2 w-full overflow-x-auto overflow-y-visible no-scrollbar', className)}>
      <div
        className="relative h-36 flex items-end justify-start mx-auto"
        style={{ width: `${totalWidth}px` }}
      >
        <AnimatePresence initial={false}>
          {cards.map((card, index) => {
            const playable = !!(isMyTurn && currentColor && isCardPlayable(card, currentColor, currentValue));
            const selected = card.id === selectedCardId;
            const isHovered = card.id === hoveredCardId;

            // Higher zIndex on hover and select so card is never occluded
            const zIndex = selected ? 60 : isHovered ? 50 : index + 1;

            return (
              <motion.div
                key={card.id}
                initial={{ y: 80, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -80, opacity: 0, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                  delay: Math.min(index * 0.02, 0.2),
                }}
                onMouseEnter={() => setHoveredCardId(card.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                style={{
                  position: 'absolute',
                  left: `${index * spacing}px`,
                  bottom: 0,
                  zIndex,
                }}
              >
                <UnoCard
                  card={card}
                  onClick={() => onCardClick?.(card)}
                  selected={selected}
                  playable={playable}
                  size="md"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

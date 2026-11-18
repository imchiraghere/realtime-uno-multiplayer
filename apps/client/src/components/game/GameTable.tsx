'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { UnoCard } from '../cards/UnoCard';
import { CardBack } from '../cards/CardBack';
import { CardHand } from '../cards/CardHand';
import { ColorPicker } from './ColorPicker';
import { GameTimer } from './GameTimer';
import { DirectionIndicator } from './DirectionIndicator';
import { PlayerSeat } from './PlayerSeat';
import { GameChat } from './GameChat';
import { GameResult } from './GameResult';
import { Button } from '../ui/Button';
import { PublicGameState, UnoCard as UnoCardType, CardColor } from '../../types/game';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import { useSounds } from '../../hooks/useSounds';
import { AlertCircle, Volume2, VolumeX } from 'lucide-react';

interface GameTableProps {
  roomId: string;
  gameState: PublicGameState;
  onPlayCard: (cardId: string, chosenColor?: string) => void;
  onDrawCard: () => void;
  onDeclareUno: () => void;
  onChallenge: () => void;
  onChooseColor: (color: CardColor) => void;
  onSendMessage: (message: string) => void;
}

export function GameTable({
  roomId,
  gameState,
  onPlayCard,
  onDrawCard,
  onDeclareUno,
  onChallenge,
  onChooseColor,
  onSendMessage,
}: GameTableProps) {
  const { user } = useAuthStore();
  const { selectedCard, selectCard, lastEvent } = useGameStore();
  const { play, toggle, isEnabled } = useSounds();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const myHand = gameState.myHand ?? [];
  const me = gameState.players.find(p => p.id === user?.id);
  const isMyTurn = !!(me && gameState.players[gameState.currentPlayerIndex]?.id === user?.id);
  const prevIsMyTurn = useRef(isMyTurn);
  
  // Arrange other players without duplicates
  const otherPlayers = gameState.players.filter(p => p.id !== user?.id);
  const leftPlayer = otherPlayers.length >= 3 ? otherPlayers[0] : (otherPlayers.length === 2 ? otherPlayers[0] : null);
  const topPlayer = otherPlayers.length === 1 ? otherPlayers[0] : (otherPlayers.length >= 3 ? otherPlayers[1] : null);
  const rightPlayer = otherPlayers.length >= 3 ? otherPlayers[2] : (otherPlayers.length === 2 ? otherPlayers[1] : null);
  
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2800);
  };
  
  useEffect(() => {
    if (gameState.phase === 'finished') {
      const timer = setTimeout(() => setShowResult(true), 600);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase]);

  // Play chime when turn shifts to current player
  useEffect(() => {
    if (!prevIsMyTurn.current && isMyTurn) {
      play('turnStart');
    }
    prevIsMyTurn.current = isMyTurn;
  }, [isMyTurn, play]);

  // Handle incoming real-time game notifications with audio feedback
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.startsWith('error:')) {
      play('error');
      showNotification(`⚠️ ${lastEvent.replace('error:', '')}`);
    } else if (lastEvent.startsWith('card_played:')) {
      const pid = lastEvent.split(':')[1];
      const p = gameState.players.find(x => x.id === pid);
      if (gameState.lastPlayedCard?.value === 'wild_shuffle') {
        play('cardShuffle');
        showNotification(`🔀 ${p?.username || 'Player'} played Wild Shuffle Hands! Hands mixed & redealt!`);
      } else {
        play('cardPlay');
        if (p && p.id !== user?.id) {
          showNotification(`${p.username} played a card`);
        }
      }
    } else if (lastEvent.startsWith('card_drawn:')) {
      play('cardDraw');
      const pid = lastEvent.split(':')[1];
      const p = gameState.players.find(x => x.id === pid);
      if (p && p.id !== user?.id) {
        showNotification(`${p.username} drew a card`);
      }
    } else if (lastEvent.startsWith('uno:')) {
      play('unoCall');
      const pid = lastEvent.split(':')[1];
      const p = gameState.players.find(x => x.id === pid);
      showNotification(`🎉 ${p?.username || 'Player'} declared UNO!`);
    } else if (lastEvent.startsWith('color:')) {
      play('colorChange');
      const parts = lastEvent.split(':');
      showNotification(`🎨 Color changed to ${parts[1]?.toUpperCase()}`);
    }
  }, [lastEvent, gameState.players, user?.id, play]);
  
  const handleCardClick = (card: UnoCardType) => {
    if (!isMyTurn) {
      play('error');
      showNotification("Wait for your turn!");
      return;
    }
    
    if (card.value === 'wild' || card.value === 'wild_draw_four' || card.value === 'wild_shuffle') {
      play('click');
      selectCard(card);
      // Color picker modal will display
    } else {
      play('cardPlay');
      onPlayCard(card.id);
      selectCard(null);
    }
  };
  
  const handleColorChosen = (color: CardColor) => {
    play('colorChange');
    if (selectedCard) {
      onPlayCard(selectedCard.id, color);
      selectCard(null);
    } else {
      onChooseColor(color);
    }
  };

  const handleDrawCard = () => {
    play('cardDraw');
    onDrawCard();
  };

  const handleToggleSound = () => {
    const nextState = toggle();
    setSoundEnabled(nextState);
    if (nextState) play('click');
  };
  
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  
  const CURRENT_COLOR_BG: Record<string, string> = {
    red: 'bg-red-500 shadow-red-500/50',
    green: 'bg-green-500 shadow-green-500/50',
    blue: 'bg-blue-500 shadow-blue-500/50',
    yellow: 'bg-yellow-400 shadow-yellow-400/50',
    wild: 'bg-purple-600 shadow-purple-600/50',
  };
  
  return (
    <div className="relative w-full h-screen bg-table-felt overflow-hidden flex flex-col justify-between">
      {/* Background felt gradient texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-emerald-950 to-green-950 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.2) 0%, transparent 70%)' }}
      />
      
      {/* Table border rim */}
      <div className="absolute inset-3 sm:inset-5 rounded-[2.5rem] border-4 border-green-800/40 shadow-inner pointer-events-none" />
      
      {/* Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className="absolute top-5 left-1/2 -translate-x-1/2 z-50 bg-black/85 backdrop-blur-md text-white px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-2xl border border-white/20"
          >
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top player area */}
      <div className="relative z-10 flex justify-center items-start pt-5 px-6 min-h-[90px]">
        {topPlayer && (
          <PlayerSeat
            player={topPlayer}
            isCurrentTurn={gameState.players[gameState.currentPlayerIndex]?.id === topPlayer.id}
            position="top"
          />
        )}
      </div>
      
      {/* Middle section: Left Player + Table Center + Right Player */}
      <div className="relative z-10 flex-1 flex items-center justify-between px-6 sm:px-12">
        {/* Left player */}
        <div className="w-28 sm:w-36 flex justify-start">
          {leftPlayer && (
            <PlayerSeat
              player={leftPlayer}
              isCurrentTurn={gameState.players[gameState.currentPlayerIndex]?.id === leftPlayer.id}
              position="left"
            />
          )}
        </div>
        
        {/* Center: Discard + Draw Piles + Direction/Timer/Color */}
        <div className="flex flex-col items-center gap-4">
          {/* Direction + Timer */}
          <div className="flex items-center gap-6 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10">
            <DirectionIndicator direction={gameState.direction} playerCount={gameState.players.length} />
            <GameTimer
              turnStartedAt={gameState.turnStartedAt}
              timerSeconds={gameState.turnTimerSeconds}
              isMyTurn={isMyTurn}
            />
          </div>
          
          {/* Active color indicator */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/15">
            <span className="text-white/70 text-xs font-semibold">Active Color:</span>
            <div className={clsx('w-4 h-4 rounded-full shadow-lg border border-white/40', CURRENT_COLOR_BG[gameState.currentColor] ?? 'bg-purple-500')} />
            <span className="text-white font-bold text-xs capitalize tracking-wide">{gameState.currentColor}</span>
          </div>
          
          {/* Piles */}
          <div className="flex items-center gap-8">
            {/* Draw pile */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                whileHover={isMyTurn ? { scale: 1.06, y: -4 } : {}}
                whileTap={isMyTurn ? { scale: 0.95 } : {}}
                onClick={isMyTurn ? handleDrawCard : undefined}
                className={clsx(isMyTurn && 'cursor-pointer')}
              >
                <CardBack size="lg" count={gameState.drawPileCount} />
              </motion.div>
              {isMyTurn ? (
                <span className="text-green-400 font-bold text-xs animate-pulse">Draw Card</span>
              ) : (
                <span className="text-white/50 text-xs font-medium">Draw Pile</span>
              )}
            </div>
            
            {/* Discard pile */}
            <div className="flex flex-col items-center gap-1.5">
              {topCard ? (
                <div className="shadow-2xl">
                  <UnoCard
                    card={topCard}
                    size="lg"
                    disabled
                    activeColor={gameState.currentColor}
                  />
                </div>
              ) : (
                <div className="w-28 h-40 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 text-xs">
                  Empty
                </div>
              )}
              <span className="text-white/50 text-xs font-medium">Discard Pile</span>
            </div>
          </div>
          
          {/* Pending draw count indicator */}
          {gameState.pendingDrawCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-red-500/30 border border-red-500/60 rounded-xl px-4 py-1.5 text-red-300 font-black text-sm shadow-lg animate-bounce"
            >
              Draw +{gameState.pendingDrawCount} cards!
            </motion.div>
          )}
        </div>
        
        {/* Right player */}
        <div className="w-28 sm:w-36 flex justify-end">
          {rightPlayer && (
            <PlayerSeat
              player={rightPlayer}
              isCurrentTurn={gameState.players[gameState.currentPlayerIndex]?.id === rightPlayer.id}
              position="right"
            />
          )}
        </div>
      </div>
      
      {/* Bottom section: Action controls & My Hand */}
      <div className="relative z-10 flex flex-col items-center pb-2 w-full">
        {/* Action buttons (UNO, Challenge) */}
        <div className="flex gap-3 mb-1">
          {isMyTurn && myHand.length === 1 && !me?.hasCalledUno && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1 } }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDeclareUno}
              className="bg-red-600 hover:bg-red-500 text-white font-black text-lg px-8 py-2.5 rounded-2xl shadow-xl shadow-red-500/50 border-2 border-white animate-pulse"
            >
              🎉 CALL UNO!
            </motion.button>
          )}
          
          {isMyTurn && gameState.phase === 'challenge_window' && gameState.challengeWindow?.active && (
            <Button variant="danger" onClick={onChallenge} glow className="font-bold">
              ⚡ Challenge Wild Draw 4
            </Button>
          )}
        </div>
        
        {/* Turn info banner */}
        <div className="flex items-center gap-3 text-xs mb-1 bg-black/40 backdrop-blur-sm px-4 py-1 rounded-full border border-white/10">
          <span className="text-white/70 font-medium">Your cards: <strong className="text-white">{myHand.length}</strong></span>
          {me?.hasCalledUno && myHand.length === 1 && (
            <span className="text-red-400 font-black animate-pulse">UNO DECLARED!</span>
          )}
          {isMyTurn ? (
            <span className="text-green-400 font-bold animate-pulse">It's Your Turn! Play or Draw</span>
          ) : (
            <span className="text-white/50 font-medium">Waiting for other players...</span>
          )}
        </div>
        
        {/* My Card Hand */}
        <CardHand
          cards={myHand}
          onCardClick={handleCardClick}
          selectedCardId={selectedCard?.id}
          currentColor={gameState.currentColor}
          currentValue={topCard?.value}
          isMyTurn={isMyTurn}
          className="max-w-full"
        />
      </div>
      
      {/* Sound toggle button */}
      <button
        onClick={handleToggleSound}
        className="absolute top-4 right-4 z-20 text-white/50 hover:text-white transition-colors bg-black/30 p-2 rounded-xl backdrop-blur-sm border border-white/10"
        title={soundEnabled ? 'Mute' : 'Unmute'}
      >
        {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-red-400" />}
      </button>
      
      {/* Color Picker Modal */}
      <ColorPicker
        isOpen={
          gameState.phase === 'choosing_color' ||
          (!!selectedCard && (selectedCard.value === 'wild' || selectedCard.value === 'wild_draw_four' || selectedCard.value === 'wild_shuffle'))
        }
        onColorSelected={handleColorChosen}
        onClose={() => selectCard(null)}
      />
      
      {/* Chat Component */}
      <GameChat roomId={roomId} currentUserId={user?.id ?? ''} />
      
      {/* Game Result Modal */}
      {showResult && gameState.phase === 'finished' && (
        <GameResult
          winner={gameState.winner}
          players={gameState.players}
          currentUserId={user?.id ?? ''}
          roomId={roomId}
        />
      )}
    </div>
  );
}

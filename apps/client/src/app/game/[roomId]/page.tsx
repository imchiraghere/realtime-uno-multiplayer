'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameTable } from '../../../components/game/GameTable';
import { useSocket } from '../../../hooks/useSocket';
import { useGame } from '../../../hooks/useGame';
import { useAuth } from '../../../hooks/useAuth';
import { CardColor } from '../../../types/game';

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();
  const { user } = useAuth();
  
  useSocket();
  
  const {
    gameState,
    isMyTurn,
    playCard,
    drawCard,
    declareUno,
    challengeWildDrawFour,
    chooseColor,
    sendMessage,
  } = useGame(roomId);
  
  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);
  
  if (!gameState) {
    return (
      <div className="min-h-screen bg-table-felt flex items-center justify-center">
        <div className="text-white/60 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-green-500 rounded-full mx-auto mb-4" />
          <p className="text-xl font-semibold">Loading game...</p>
        </div>
      </div>
    );
  }
  
  return (
    <GameTable
      roomId={roomId}
      gameState={gameState}
      onPlayCard={(cardId, chosenColor) => playCard(cardId, chosenColor)}
      onDrawCard={drawCard}
      onDeclareUno={declareUno}
      onChallenge={challengeWildDrawFour}
      onChooseColor={(color) => chooseColor(color)}
      onSendMessage={sendMessage}
    />
  );
}

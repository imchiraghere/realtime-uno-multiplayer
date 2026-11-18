'use client';

import { useEffect, useCallback } from 'react';
import { useSocketStore } from '../store/socketStore';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { PublicGameState } from '../types/game';

export function useGame(roomId: string) {
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const { gameState, myHand, setGameState, setLastEvent } = useGameStore();
  
  useEffect(() => {
    if (!socket || !roomId) return;
    
    socket.on('game_state_updated', ({ state }: { state: PublicGameState }) => {
      setGameState(state);
    });
    
    socket.on('private_state_updated', ({ state }: { state: PublicGameState }) => {
      setGameState(state);
    });
    
    socket.on('card_played', ({ playerId }: { playerId: string }) => {
      setLastEvent(`card_played:${playerId}`);
    });
    
    socket.on('card_drawn', ({ playerId }: { playerId: string }) => {
      setLastEvent(`card_drawn:${playerId}`);
    });
    
    socket.on('uno_declared', ({ playerId }: { playerId: string }) => {
      setLastEvent(`uno:${playerId}`);
    });
    
    socket.on('challenge_result', ({ challengerId, success }: { challengerId: string; success: boolean }) => {
      setLastEvent(`challenge:${challengerId}:${success}`);
    });
    
    socket.on('color_changed', ({ color, playerId }: { color: string; playerId: string }) => {
      setLastEvent(`color:${color}:${playerId}`);
    });

    socket.on('error_message', ({ message }: { message: string }) => {
      setLastEvent(`error:${message}`);
    });
    
    // Request current state immediately and on reconnect
    const requestState = () => {
      socket.emit('request_game_state', { roomId });
    };

    socket.on('connect', requestState);
    requestState();
    
    return () => {
      socket.off('connect', requestState);
      socket.off('game_state_updated');
      socket.off('private_state_updated');
      socket.off('card_played');
      socket.off('card_drawn');
      socket.off('uno_declared');
      socket.off('challenge_result');
      socket.off('color_changed');
      socket.off('error_message');
    };
  }, [socket, roomId]);
  
  const isMyTurn = gameState
    ? gameState.players[gameState.currentPlayerIndex]?.id === user?.id
    : false;
  
  const playCard = useCallback((cardId: string, chosenColor?: string) => {
    socket?.emit('play_card', { roomId, cardId, chosenColor });
  }, [socket, roomId]);
  
  const drawCard = useCallback(() => {
    socket?.emit('draw_card', { roomId });
  }, [socket, roomId]);
  
  const declareUno = useCallback(() => {
    socket?.emit('declare_uno', { roomId });
  }, [socket, roomId]);
  
  const challengeWildDrawFour = useCallback(() => {
    socket?.emit('challenge_wild_draw_four', { roomId });
  }, [socket, roomId]);
  
  const chooseColor = useCallback((color: string) => {
    socket?.emit('choose_wild_color', { roomId, color });
  }, [socket, roomId]);
  
  const sendMessage = useCallback((message: string) => {
    socket?.emit('send_chat_message', { roomId, message });
  }, [socket, roomId]);
  
  return {
    gameState,
    myHand,
    isMyTurn,
    playCard,
    drawCard,
    declareUno,
    challengeWildDrawFour,
    chooseColor,
    sendMessage,
  };
}

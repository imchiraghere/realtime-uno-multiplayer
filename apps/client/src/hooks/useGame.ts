'use client';

import { useEffect, useCallback } from 'react';
import { useSocketStore } from '../store/socketStore';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { PublicGameState } from '../types/game';
import { api } from '../lib/api';

export function useGame(roomId: string) {
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const { gameState, myHand, setGameState, setLastEvent } = useGameStore();
  
  // REST API fallback for initial load & reconnection
  useEffect(() => {
    if (!roomId) return;
    let isMounted = true;

    const fetchState = async () => {
      try {
        const res = await api.get<PublicGameState>(`/api/game/${roomId}`);
        if (isMounted && res) {
          setGameState(res);
        }
      } catch {
        // ignore
      }
    };

    fetchState();
    const interval = setInterval(() => {
      if (!socket || !socket.connected) {
        fetchState();
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, socket, setGameState]);
  
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
    if (socket && socket.connected) {
      socket.emit('play_card', { roomId, cardId, chosenColor });
    } else {
      api.post<PublicGameState>(`/api/game/${roomId}/play`, { cardId, chosenColor })
        .then((res) => { if (res) setGameState(res); })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error playing card';
          setLastEvent(`error:${msg}`);
        });
    }
  }, [socket, roomId, setGameState, setLastEvent]);
  
  const drawCard = useCallback(() => {
    if (socket && socket.connected) {
      socket.emit('draw_card', { roomId });
    } else {
      api.post<PublicGameState>(`/api/game/${roomId}/draw`)
        .then((res) => { if (res) setGameState(res); })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error drawing card';
          setLastEvent(`error:${msg}`);
        });
    }
  }, [socket, roomId, setGameState, setLastEvent]);
  
  const declareUno = useCallback(() => {
    if (socket && socket.connected) {
      socket.emit('declare_uno', { roomId });
    } else {
      api.post<PublicGameState>(`/api/game/${roomId}/uno`)
        .then((res) => { if (res) setGameState(res); })
        .catch(() => {});
    }
  }, [socket, roomId, setGameState]);
  
  const challengeWildDrawFour = useCallback(() => {
    if (socket && socket.connected) {
      socket.emit('challenge_wild_draw_four', { roomId });
    } else {
      api.post<PublicGameState>(`/api/game/${roomId}/challenge`)
        .then((res) => { if (res) setGameState(res); })
        .catch(() => {});
    }
  }, [socket, roomId, setGameState]);
  
  const chooseColor = useCallback((color: string) => {
    if (socket && socket.connected) {
      socket.emit('choose_wild_color', { roomId, color });
    } else {
      api.post<PublicGameState>(`/api/game/${roomId}/color`, { color })
        .then((res) => { if (res) setGameState(res); })
        .catch(() => {});
    }
  }, [socket, roomId, setGameState]);
  
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

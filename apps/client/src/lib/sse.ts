'use client';

import { SERVER_URL } from './constants';
import { GameRoom } from '../types/room';
import { PublicGameState } from '../types/game';

export interface RoomSSEHandlers {
  onRoomUpdated?: (data: { room: GameRoom }) => void;
  onPlayerJoined?: (data: { room: GameRoom }) => void;
  onPlayerLeft?: (data: { userId: string; room: GameRoom | null }) => void;
  onGameStarted?: (data: { sessionId: string; roomId: string }) => void;
  onError?: (err: Event) => void;
}

export function subscribeToRoomSSE(
  roomCode: string,
  token: string | null,
  handlers: RoomSSEHandlers
): () => void {
  if (typeof window === 'undefined' || !roomCode || !token) {
    return () => {};
  }

  const url = `${SERVER_URL}/api/rooms/${encodeURIComponent(roomCode)}/events?token=${encodeURIComponent(token)}`;
  let eventSource: EventSource | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    try {
      eventSource = new EventSource(url);

      eventSource.addEventListener('room_updated', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onRoomUpdated?.(data);
        } catch {}
      });

      eventSource.addEventListener('player_joined', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onPlayerJoined?.(data);
        } catch {}
      });

      eventSource.addEventListener('player_left', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onPlayerLeft?.(data);
        } catch {}
      });

      eventSource.addEventListener('game_started', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onGameStarted?.(data);
        } catch {}
      });

      eventSource.onerror = (err) => {
        handlers.onError?.(err);
      };
    } catch {
      // ignore
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

export interface GameSSEHandlers {
  onGameStateUpdated?: (data: { state: PublicGameState }) => void;
  onCardPlayed?: (data: { playerId: string; cardId: string; chosenColor?: string }) => void;
  onCardDrawn?: (data: { playerId: string }) => void;
  onUnoDeclared?: (data: { playerId: string }) => void;
  onChallengeResult?: (data: { challengerId: string; success: boolean }) => void;
  onColorChanged?: (data: { color: string; playerId: string }) => void;
  onGameOver?: (data: { winner: string | null; players: Array<{ id: string; username: string; score: number }> }) => void;
  onChatMessage?: (data: { id: string; userId: string; username: string; message: string; createdAt: string; avatarUrl?: string }) => void;
  onError?: (err: Event) => void;
}

export function subscribeToGameSSE(
  roomId: string,
  token: string | null,
  handlers: GameSSEHandlers
): () => void {
  if (typeof window === 'undefined' || !roomId || !token) {
    return () => {};
  }

  const url = `${SERVER_URL}/api/game/${encodeURIComponent(roomId)}/events?token=${encodeURIComponent(token)}`;
  let eventSource: EventSource | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    try {
      eventSource = new EventSource(url);

      eventSource.addEventListener('game_state_updated', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onGameStateUpdated?.(data);
        } catch {}
      });

      eventSource.addEventListener('card_played', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onCardPlayed?.(data);
        } catch {}
      });

      eventSource.addEventListener('card_drawn', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onCardDrawn?.(data);
        } catch {}
      });

      eventSource.addEventListener('uno_declared', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onUnoDeclared?.(data);
        } catch {}
      });

      eventSource.addEventListener('challenge_result', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onChallengeResult?.(data);
        } catch {}
      });

      eventSource.addEventListener('color_changed', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onColorChanged?.(data);
        } catch {}
      });

      eventSource.addEventListener('game_over', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onGameOver?.(data);
        } catch {}
      });

      eventSource.addEventListener('chat_message', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlers.onChatMessage?.(data);
        } catch {}
      });

      eventSource.onerror = (err) => {
        handlers.onError?.(err);
      };
    } catch {
      // ignore
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}


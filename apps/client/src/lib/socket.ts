import { io, Socket } from 'socket.io-client';
import { WS_URL } from './constants';

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(): Socket {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket first.');
  }
  return socket;
}

export function initSocket(token: string): Socket {
  if (socket && currentToken === token && (socket.connected || socket.active)) {
    return socket;
  }
  
  if (socket) {
    socket.disconnect();
  }
  
  currentToken = token;
  socket = io(WS_URL, {
    auth: { token },
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    timeout: 20000,
  });
  
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

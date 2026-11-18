import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  
  setSocket: (socket: Socket | null) => void;
  setConnected: (connected: boolean) => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  isConnected: false,
  
  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ isConnected: connected }),
}));

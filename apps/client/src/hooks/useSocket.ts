'use client';

import { useEffect } from 'react';
import { initSocket, disconnectSocket } from '../lib/socket';
import { useSocketStore } from '../store/socketStore';
import { useAuthStore } from '../store/authStore';

export function useSocket() {
  const { token } = useAuthStore();
  const { socket, setSocket, setConnected } = useSocketStore();
  
  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      return;
    }
    
    const activeSocket = initSocket(token);
    setSocket(activeSocket);
    setConnected(activeSocket.connected);
    
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    
    activeSocket.on('connect', handleConnect);
    activeSocket.on('disconnect', handleDisconnect);
    
    return () => {
      activeSocket.off('connect', handleConnect);
      activeSocket.off('disconnect', handleDisconnect);
      // Keep socket alive across page route changes!
    };
  }, [token]);
  
  return { socket };
}

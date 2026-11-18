'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';
import { api } from '../../lib/api';

export function AppProviders({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, loginAsGuest } = useAuthStore();
  
  // Keep socket connected globally
  useSocket();

  useEffect(() => {
    if (token) {
      api.setToken(token);
    } else if (!isAuthenticated) {
      // Auto-authenticate guests so rooms and games work seamlessly
      loginAsGuest().catch(() => {});
    }
  }, [token, isAuthenticated, loginAsGuest]);

  return <>{children}</>;
}


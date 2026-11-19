'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';
import { api } from '../../lib/api';

export function AppProviders({ children }: { children: ReactNode }) {
  const { token } = useAuthStore();
  
  // Keep socket connected globally when user has a token
  useSocket();

  useEffect(() => {
    if (token) {
      api.setToken(token);
    } else {
      api.setToken(null);
    }
  }, [token]);

  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

export function useAuth() {
  const store = useAuthStore();
  
  useEffect(() => {
    if (store.token) {
      api.setToken(store.token);
    }
  }, [store.token]);
  
  return store;
}

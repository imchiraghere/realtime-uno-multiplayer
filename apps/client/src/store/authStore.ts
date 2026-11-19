import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/user';
import { api } from '../lib/api';
import { disconnectSocket } from '../lib/socket';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const result = await api.post<{ user: User; token: string }>('/api/auth/login', { email, password });
          api.setToken(result.token);
          set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
      
      register: async (email, username, password) => {
        set({ isLoading: true });
        try {
          const result = await api.post<{ user: User; token: string }>('/api/auth/register', { email, username, password });
          api.setToken(result.token);
          set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
      
      loginAsGuest: async () => {
        set({ isLoading: true });
        try {
          const result = await api.post<{ user: User; token: string }>('/api/auth/guest');
          api.setToken(result.token);
          set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },
      
      logout: () => {
        api.setToken(null);
        try {
          disconnectSocket();
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('uno-auth');
          } catch {
            // ignore
          }
        }
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },
      
      setUser: (user) => set({ user }),
    }),
    {
      name: 'uno-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

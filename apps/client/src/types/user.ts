export interface User {
  id: string;
  email?: string;
  username: string;
  isGuest: boolean;
  isAdmin: boolean;
  profile?: {
    avatarUrl?: string;
    bio?: string;
    country?: string;
  };
  stats?: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    highestScore: number;
    currentRating: number;
    level: number;
    xp: number;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

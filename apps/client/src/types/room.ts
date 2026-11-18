export interface RoomPlayer {
  id: string;
  userId: string;
  seat: number;
  isReady: boolean;
  isBot: boolean;
  user: {
    username: string;
    profile?: { avatarUrl?: string };
    stats?: { currentRating: number; wins: number };
  };
}

export interface GameRoom {
  id: string;
  code: string;
  name: string;
  hostId: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  isPrivate: boolean;
  maxPlayers: number;
  gameMode: 'CLASSIC' | 'HOUSE_RULES' | 'QUICK_MATCH';
  turnTimerSeconds: number;
  scoreLimit: number;
  houseRules: Record<string, unknown>;
  allowBots: boolean;
  players: RoomPlayer[];
}

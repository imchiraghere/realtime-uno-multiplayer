import { roomsService } from '../rooms/rooms.service';
import { logger } from '../../utils/logger';

interface QueueEntry {
  userId: string;
  username: string;
  socketId: string;
  joinedAt: number;
  gameMode: string;
}

class MatchmakingService {
  private queue: QueueEntry[] = [];
  private callbacks = new Map<string, (roomCode: string) => void>();
  
  addToQueue(entry: QueueEntry, onMatch: (roomCode: string) => void): void {
    if (this.queue.some(e => e.userId === entry.userId)) return;
    this.queue.push(entry);
    this.callbacks.set(entry.userId, onMatch);
    this.tryMatch();
  }
  
  removeFromQueue(userId: string): void {
    this.queue = this.queue.filter(e => e.userId !== userId);
    this.callbacks.delete(userId);
  }
  
  private async tryMatch(): Promise<void> {
    const classic = this.queue.filter(e => e.gameMode === 'classic' || e.gameMode === 'quick_match');
    if (classic.length < 2) return;
    
    const matched = classic.slice(0, 2);
    this.queue = this.queue.filter(e => !matched.find(m => m.userId === e.userId));
    
    try {
      const host = matched[0];
      const room = await roomsService.createRoom(host.userId, {
        name: `Quick Match`,
        isPrivate: false,
        maxPlayers: 2,
        gameMode: 'QUICK_MATCH',
        turnTimerSeconds: 20,
        scoreLimit: 200,
        houseRules: {},
        allowBots: false,
        spectatorMode: false,
      });
      
      for (const player of matched.slice(1)) {
        await roomsService.joinRoom(player.userId, room.code);
      }
      
      for (const player of matched) {
        const cb = this.callbacks.get(player.userId);
        cb?.(room.code);
        this.callbacks.delete(player.userId);
      }
    } catch (err) {
      logger.error('Matchmaking error', err);
      // Put players back in queue
      this.queue.unshift(...matched);
    }
  }
}

export const matchmakingService = new MatchmakingService();

export class TurnTimer {
  private timers = new Map<string, NodeJS.Timeout>();
  
  startTimer(
    roomId: string,
    playerId: string,
    seconds: number,
    onTimeout: (roomId: string, playerId: string) => void
  ): void {
    this.clearTimer(roomId);
    const timer = setTimeout(() => {
      this.timers.delete(roomId);
      onTimeout(roomId, playerId);
    }, seconds * 1000);
    this.timers.set(roomId, timer);
  }
  
  clearTimer(roomId: string): void {
    const timer = this.timers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(roomId);
    }
  }
  
  resetTimer(
    roomId: string,
    playerId: string,
    seconds: number,
    onTimeout: (roomId: string, playerId: string) => void
  ): void {
    this.clearTimer(roomId);
    this.startTimer(roomId, playerId, seconds, onTimeout);
  }
}

export const turnTimer = new TurnTimer();

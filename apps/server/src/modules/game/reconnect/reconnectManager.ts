interface DisconnectRecord {
  playerId: string;
  roomId: string;
  disconnectedAt: number;
  timeoutSeconds: number;
  timer: NodeJS.Timeout;
}

class ReconnectManager {
  private records = new Map<string, DisconnectRecord>(); // key: roomId_playerId
  
  startReconnectTimer(
    roomId: string,
    playerId: string,
    timeoutSeconds: number,
    onTimeout: (roomId: string, playerId: string) => void
  ): void {
    const key = `${roomId}_${playerId}`;
    this.cancelTimer(roomId, playerId);
    
    const timer = setTimeout(() => {
      this.records.delete(key);
      onTimeout(roomId, playerId);
    }, timeoutSeconds * 1000);
    
    this.records.set(key, {
      playerId,
      roomId,
      disconnectedAt: Date.now(),
      timeoutSeconds,
      timer,
    });
  }
  
  cancelTimer(roomId: string, playerId: string): void {
    const key = `${roomId}_${playerId}`;
    const record = this.records.get(key);
    if (record) {
      clearTimeout(record.timer);
      this.records.delete(key);
    }
  }
  
  isDisconnected(roomId: string, playerId: string): boolean {
    return this.records.has(`${roomId}_${playerId}`);
  }
}

export const reconnectManager = new ReconnectManager();

import { Socket, Server } from 'socket.io';
import { chatService } from '../../modules/chat/chat.service';

const rateLimits = new Map<string, number[]>();

export function registerChatHandlers(io: Server, socket: Socket, userId: string): void {
  socket.on('send_chat_message', async (data: { roomId: string; message: string }) => {
    try {
      // Rate limit: 10 messages per 10 seconds
      const now = Date.now();
      const userMessages = rateLimits.get(userId) || [];
      const recent = userMessages.filter(t => now - t < 10000);
      if (recent.length >= 10) {
        socket.emit('error_message', { message: 'Sending messages too quickly' });
        return;
      }
      recent.push(now);
      rateLimits.set(userId, recent);
      
      const msg = await chatService.saveMessage(data.roomId, userId, data.message);
      io.to(data.roomId).emit('chat_message', {
        id: msg.id,
        userId,
        username: msg.user.username,
        avatarUrl: msg.user.profile?.avatarUrl,
        message: data.message,
        createdAt: msg.createdAt,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error sending message';
      socket.emit('error_message', { message });
    }
  });
}

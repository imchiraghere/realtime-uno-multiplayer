import { prisma } from '../../config/database';

export class ChatService {
  async saveMessage(roomId: string, userId: string, message: string) {
    if (message.length > 500) throw new Error('Message too long');
    
    return prisma.chatMessage.create({
      data: { roomId, userId, message: message.trim() },
      include: { user: { select: { username: true, profile: { select: { avatarUrl: true } } } } },
    });
  }
  
  async getRoomMessages(roomId: string, limit = 50) {
    return prisma.chatMessage.findMany({
      where: { roomId },
      include: { user: { select: { username: true, profile: { select: { avatarUrl: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const chatService = new ChatService();

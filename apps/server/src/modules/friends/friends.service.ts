import { prisma } from '../../config/database';

export class FriendsService {
  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new Error('Cannot add yourself');
    
    const existing = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });
    if (existing) throw new Error('Request already sent');
    
    return prisma.friendRequest.create({
      data: { senderId, receiverId },
      include: { sender: { select: { username: true } }, receiver: { select: { username: true } } },
    });
  }
  
  async respondToRequest(requestId: string, userId: string, accept: boolean) {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== userId) throw new Error('Request not found');
    
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: accept ? 'ACCEPTED' : 'DECLINED' },
    });
    
    if (accept) {
      await prisma.friend.createMany({
        data: [
          { userId: request.senderId, friendId: request.receiverId },
          { userId: request.receiverId, friendId: request.senderId },
        ],
        skipDuplicates: true,
      });
    }
  }
  
  async getFriends(userId: string) {
    return prisma.friend.findMany({
      where: { userId },
      include: { friend: { include: { profile: true, stats: true } } },
    });
  }
  
  async getPendingRequests(userId: string) {
    return prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: { sender: { include: { profile: true } } },
    });
  }
}

export const friendsService = new FriendsService();

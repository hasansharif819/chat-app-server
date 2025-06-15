import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketService } from '../socket/socket.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private socketService: SocketService,
  ) {}

  async getChats(userId: string) {
    const chats = await this.prisma.chatUser.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            users: {
              include: {
                user: true,
              },
            },
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        chat: {
          updatedAt: 'desc',
        },
      },
    });

    // Notify user of their chat list update
    this.socketService.io.to(`user_${userId}`).emit('chatsUpdated', chats);
    
    return chats;
  }

  async getOrCreateChat(userId1: string, userId2: string) {
    // Check if chat exists
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        users: {
          every: {
            userId: { in: [userId1, userId2] },
          },
        },
      },
      include: {
        users: { include: { user: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (existingChat) {
      // Notify both users about chat access
      this.notifyChatAccess(existingChat.id, [userId1, userId2]);
      return existingChat;
    }

    // Create new chat
    const newChat = await this.prisma.chat.create({
      data: {
        users: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
      include: {
        users: { include: { user: true } },
      },
    });

    // Notify both users about new chat
    this.notifyNewChat([userId1, userId2], newChat);
    
    return newChat;
  }

  async getMessages(chatId: string, userId: string) {
    const messages = await this.prisma.message.findMany({
      where: { chatId },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Notify that user has viewed these messages
    this.socketService.io.to(chatId).emit('messagesViewed', {
      chatId,
      userId,
      messageIds: messages.map(m => m.id),
    });

    return messages;
  }

  async markMessagesAsRead(chatId: string, userId: string) {
    const updatedMessages = await this.prisma.message.updateMany({
      where: {
        chatId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    // Notify other participants that messages were read
    this.socketService.io.to(chatId).emit('messagesRead', {
      chatId,
      userId,
      count: updatedMessages.count,
    });

    return updatedMessages;
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    // Get or create chat
    const chat = await this.getOrCreateChat(senderId, receiverId);
    
    // Create message
    const message = await this.prisma.message.create({
      data: {
        chatId: chat.id,
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    // Update chat timestamp
    await this.prisma.chat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() },
    });

    // Notify participants
    this.notifyNewMessage(chat.id, message);
    
    return message;
  }

  // Helper methods for socket notifications
  private notifyNewMessage(chatId: string, message: any) {
    this.socketService.io.to(chatId).emit('newMessage', message);
    this.socketService.io.to(`user_${message.receiverId}`).emit('newMessageNotification', {
      chatId,
      message,
    });
  }

  private notifyNewChat(userIds: string[], chat: any) {
    userIds.forEach(userId => {
      this.socketService.io.to(`user_${userId}`).emit('newChat', chat);
    });
  }

  private notifyChatAccess(chatId: string, userIds: string[]) {
    userIds.forEach(userId => {
      this.socketService.io.to(`user_${userId}`).emit('chatAccessed', { chatId });
    });
  }
}
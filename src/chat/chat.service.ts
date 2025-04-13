import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getChats(userId: string) {
    return this.prisma.chatUser.findMany({
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
  }

  async getOrCreateChat(userId1: string, userId2: string) {
    // Check if chat already exists between these users
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        users: {
          every: {
            userId: {
              in: [userId1, userId2],
            },
          },
        },
      },
      include: {
        users: true,
      },
    });

    if (existingChat) {
      return existingChat;
    }

    // Create new chat
    return this.prisma.chat.create({
      data: {
        users: {
          create: [
            { userId: userId1 },
            { userId: userId2 },
          ],
        },
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getMessages(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async markMessagesAsRead(chatId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: {
        chatId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    // 1. Get or create chat between the two users
    const chat = await this.getOrCreateChat(senderId, receiverId);
  
    // 2. Create the message
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
  
    // 3. Update chat updatedAt to show it's active
    await this.prisma.chat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() },
    });
  
    return message;
  }
  
}
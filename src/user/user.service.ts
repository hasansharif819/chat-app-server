import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        connections: {
          include: {
            connectedUser: true,
          },
        },
        connectedBy: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async updateProfile(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async getConnections(userId: string) {
    return this.prisma.connection.findMany({
      where: {
        OR: [
          { userId },
          { connectedUserId: userId },
        ],
        status: 'accepted',
      },
      include: {
        user: true,
        connectedUser: true,
      },
    });
  }

  async requestConnection(userId: string, connectedUserId: string) {
    return this.prisma.connection.create({
      data: {
        userId,
        connectedUserId,
        status: 'pending',
      },
      include: {
        connectedUser: true,
      },
    });
  }

  async respondToConnection(connectionId: string, status: 'accepted' | 'rejected') {
    return this.prisma.connection.update({
      where: { id: connectionId },
      data: { status },
    });
  }
}
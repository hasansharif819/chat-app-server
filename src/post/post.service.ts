import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string, data: any) {
    return this.prisma.post.create({
      data: {
        ...data,
        authorId: userId,
      },
    });
  }

  async getPosts(userId: string) {
    // Get user connections
    const connections = await this.prisma.connection.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { connectedUserId: userId, status: 'accepted' },
        ],
      },
    });

    const connectedUserIds = connections.map(c => 
      c.userId === userId ? c.connectedUserId : c.userId
    );

    return this.prisma.post.findMany({
      where: {
        authorId: {
          in: [...connectedUserIds, userId],
        },
        reachCount: {
          lt: this.prisma.post.fields.reachLimit,
        },
      },
      include: {
        author: true,
        likes: true,
        comments: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async likePost(userId: string, postId: string) {
    const existingLike = await this.prisma.like.findFirst({
      where: { userId, postId },
    });

    if (existingLike) {
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      return { liked: false };
    }

    await this.prisma.like.create({
      data: { userId, postId },
    });

    // Increment reach count if not already reached limit
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        reachCount: {
          increment: 1,
        },
      },
    });

    return { liked: true };
  }

  async commentOnPost(userId: string, postId: string, content: string) {
    return this.prisma.comment.create({
      data: { userId, postId, content },
      include: {
        user: true,
      },
    });
  }
}
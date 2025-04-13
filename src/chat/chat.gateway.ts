import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { UseGuards } from '@nestjs/common';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { PrismaService } from '../prisma/prisma.service';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
    },
  })
  export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    constructor(private prisma: PrismaService) {}
  
    private connectedUsers: Map<string, string> = new Map();
  
    async handleConnection(client: Socket) {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }
  
      try {
        // Verify token (you'll need to implement this)
        const user = await this.verifyToken(token);
        this.connectedUsers.set(client.id, user.id);
        console.log(`Client connected: ${user.id}`);
      } catch (error) {
        client.disconnect();
      }
    }
  
    handleDisconnect(client: Socket) {
      this.connectedUsers.delete(client.id);
      console.log(`Client disconnected: ${client.id}`);
    }
  
    private async verifyToken(token: string): Promise<any> {
      // Implement token verification logic
      // This is a placeholder - you should use your JWT verification logic
      return { id: 'user-id-from-token' };
    }
  
    @SubscribeMessage('sendMessage')
    async handleMessage(
      @MessageBody() data: { chatId: string; content: string; receiverId: string },
      @ConnectedSocket() client: Socket,
    ) {
      const senderId = this.connectedUsers.get(client.id);
      if (!senderId) return;
  
      // Save message to database
      const message = await this.prisma.message.create({
        data: {
          content: data.content,
          chatId: data.chatId,
          senderId,
          receiverId: data.receiverId,
        },
        include: {
          sender: true,
          receiver: true,
        },
      });
  
      // Notify receiver if connected
      this.connectedUsers.forEach((userId, socketId) => {
        if (userId === data.receiverId) {
          this.server.to(socketId).emit('receiveMessage', message);
        }
      });
  
      return message;
    }
  
    @SubscribeMessage('joinChat')
    async handleJoinChat(
      @MessageBody() chatId: string,
      @ConnectedSocket() client: Socket,
    ) {
      client.join(chatId);
      console.log(`Client joined chat: ${chatId}`);
    }
  }
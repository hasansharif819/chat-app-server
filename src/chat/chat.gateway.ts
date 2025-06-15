import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  
  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(client.id, userId);
      console.log(`Client connected: ${client.id}, User ID: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  notifyNewMessage(chatId: string, message: any) {
    this.server.to(chatId).emit('new-message', message);
  }

  notifyChatUpdate(userId: string, chat: any) {
    // Find all socket connections for this user
    const userSockets = Array.from(this.connectedUsers.entries())
      .filter(([_, uid]) => uid === userId)
      .map(([socketId]) => socketId);
    
    userSockets.forEach(socketId => {
      this.server.to(socketId).emit('chat-update', chat);
    });
  }
}
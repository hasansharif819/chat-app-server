// import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { Injectable } from '@nestjs/common';

// @WebSocketGateway({
//   namespace: '/chat',
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true,
//   }
// })
// @Injectable()
// export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer() server: Server;
  
//   private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

//   handleConnection(client: Socket) {
//     const userId = client.handshake.query.userId as string;
//     if (userId) {
//       this.connectedUsers.set(client.id, userId);
//       console.log(`Client connected: ${client.id}, User ID: ${userId}`);
//     }
//   }

//   handleDisconnect(client: Socket) {
//     this.connectedUsers.delete(client.id);
//     console.log(`Client disconnected: ${client.id}`);
//   }

//   notifyNewMessage(chatId: string, message: any) {
//     this.server.to(chatId).emit('new-message', message);
//   }

//   notifyChatUpdate(userId: string, chat: any) {
//     // Find all socket connections for this user
//     const userSockets = Array.from(this.connectedUsers.entries())
//       .filter(([_, uid]) => uid === userId)
//       .map(([socketId]) => socketId);
    
//     userSockets.forEach(socketId => {
//       this.server.to(socketId).emit('chat-update', chat);
//     });
//   }
// }





// import {
//   WebSocketGateway,
//   WebSocketServer,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   SubscribeMessage,
//   MessageBody,
//   ConnectedSocket,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { Injectable } from '@nestjs/common';

// @WebSocketGateway({
//   namespace: '/chat',
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true,
//   },
// })
// @Injectable()
// export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer() server: Server;
//   private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

//   handleConnection(client: Socket) {
//     const userId = client.handshake.query.userId as string;
//     if (userId) {
//       this.connectedUsers.set(client.id, userId);
//       client.join(`user_${userId}`);
//       console.log(`Client connected: ${client.id}, User ID: ${userId}`);
//     }
//   }

//   handleDisconnect(client: Socket) {
//     const userId = this.connectedUsers.get(client.id);
//     if (userId) {
//       client.leave(`user_${userId}`);
//     }
//     this.connectedUsers.delete(client.id);
//     console.log(`Client disconnected: ${client.id}`);
//   }

//   // === WebRTC Signaling Events ===

//   @SubscribeMessage('call-user')
//   handleCallUser(
//     @MessageBody()
//     data: {
//       targetUserId: string;
//       offer: RTCSessionDescriptionInit;
//       callerId: string;
//     },
//     @ConnectedSocket() client: Socket,
//   ) {
//     this.server.to(`user_${data.targetUserId}`).emit('incoming-call', {
//       from: data.callerId,
//       offer: data.offer,
//     });
//   }

//   @SubscribeMessage('answer-call')
//   handleAnswerCall(
//     @MessageBody()
//     data: {
//       targetUserId: string;
//       answer: RTCSessionDescriptionInit;
//     },
//     @ConnectedSocket() client: Socket,
//   ) {
//     this.server.to(`user_${data.targetUserId}`).emit('call-answered', {
//       from: this.connectedUsers.get(client.id),
//       answer: data.answer,
//     });
//   }

//   @SubscribeMessage('ice-candidate')
//   handleIceCandidate(
//     @MessageBody()
//     data: {
//       targetUserId: string;
//       candidate: RTCIceCandidateInit;
//     },
//     @ConnectedSocket() client: Socket,
//   ) {
//     this.server.to(`user_${data.targetUserId}`).emit('ice-candidate', {
//       from: this.connectedUsers.get(client.id),
//       candidate: data.candidate,
//     });
//   }

//   // === Messaging & Notification Events ===

//   notifyNewMessage(chatId: string, message: any) {
//     this.server.to(chatId).emit('new-message', message);
//   }

//   notifyChatUpdate(userId: string, chat: any) {
//     const userSockets = Array.from(this.connectedUsers.entries())
//       .filter(([_, uid]) => uid === userId)
//       .map(([socketId]) => socketId);
    
//     userSockets.forEach(socketId => {
//       this.server.to(socketId).emit('chat-update', chat);
//     });
//   }
// }





// import {
//   WebSocketGateway,
//   WebSocketServer,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   SubscribeMessage,
//   MessageBody,
//   ConnectedSocket,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { Injectable, Logger } from '@nestjs/common';

// @WebSocketGateway({
//   namespace: '/chat',
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true,
//   },
// })
// @Injectable()
// export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer() server: Server;
//   private logger = new Logger(ChatGateway.name);
//   private connectedUsers: Map<string, string> = new Map(); // socketId -> userId
//   private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

//   handleConnection(client: Socket) {
//     const userId = client.handshake.query.userId as string;
//     if (!userId) {
//       client.disconnect();
//       return;
//     }

//     this.connectedUsers.set(client.id, userId);
    
//     // Track all sockets for this user
//     if (!this.userSockets.has(userId)) {
//       this.userSockets.set(userId, new Set());
//     }
//     this.userSockets.get(userId)?.add(client.id);

//     client.join(`user_${userId}`);
//     this.logger.log(`Client connected: ${client.id}, User ID: ${userId}`);
//   }

//   handleDisconnect(client: Socket) {
//     const userId = this.connectedUsers.get(client.id);
//     if (userId) {
//       // Remove this socket from the user's socket set
//       this.userSockets.get(userId)?.delete(client.id);
      
//       // If this was the last socket for the user, clean up
//       if (this.userSockets.get(userId)?.size === 0) {
//         this.userSockets.delete(userId);
//       }

//       client.leave(`user_${userId}`);
//       this.logger.log(`Client disconnected: ${client.id}, User ID: ${userId}`);
//     }
//     this.connectedUsers.delete(client.id);
//   }

//   // === WebRTC Signaling ===

//   @SubscribeMessage('call-user')
//   handleCallUser(
//     @MessageBody() data: { targetUserId: string; offer: RTCSessionDescriptionInit; callerId: string },
//     @ConnectedSocket() client: Socket,
//   ) {
//     const callerId = this.connectedUsers.get(client.id);
//     if (!callerId || callerId !== data.callerId) {
//       this.logger.warn(`Unauthorized call attempt from ${client.id}`);
//       return;
//     }

//     this.logger.log(`Call from ${callerId} to ${data.targetUserId}`);
//     this.server.to(`user_${data.targetUserId}`).emit('incoming-call', {
//       from: callerId,
//       offer: data.offer,
//     });
//   }

//   @SubscribeMessage('answer-call')
//   handleAnswerCall(
//     @MessageBody() data: { targetUserId: string; answer: RTCSessionDescriptionInit },
//     @ConnectedSocket() client: Socket,
//   ) {
//     const answererId = this.connectedUsers.get(client.id);
//     if (!answererId) {
//       this.logger.warn(`Unauthorized answer attempt from ${client.id}`);
//       return;
//     }

//     this.logger.log(`Call answered by ${answererId} to ${data.targetUserId}`);
//     this.server.to(`user_${data.targetUserId}`).emit('call-answered', {
//       from: answererId,
//       answer: data.answer,
//     });
//   }

//   @SubscribeMessage('ice-candidate')
//   handleIceCandidate(
//     @MessageBody() data: { targetUserId: string; candidate: RTCIceCandidateInit },
//     @ConnectedSocket() client: Socket,
//   ) {
//     const senderId = this.connectedUsers.get(client.id);
//     if (!senderId) {
//       this.logger.warn(`Unauthorized ICE candidate from ${client.id}`);
//       return;
//     }

//     this.server.to(`user_${data.targetUserId}`).emit('ice-candidate', {
//       from: senderId,
//       candidate: data.candidate,
//     });
//   }

//   @SubscribeMessage('end-call')
//   handleEndCall(
//     @MessageBody() data: { targetUserId: string },
//     @ConnectedSocket() client: Socket,
//   ) {
//     const callerId = this.connectedUsers.get(client.id);
//     if (!callerId) {
//       this.logger.warn(`Unauthorized end-call from ${client.id}`);
//       return;
//     }

//     this.logger.log(`Call ended by ${callerId} to ${data.targetUserId}`);
//     this.server.to(`user_${data.targetUserId}`).emit('call-ended', {
//       from: callerId,
//     });
//   }

//   // === Utility Methods ===

//   private getUserSockets(userId: string): Socket[] {
//     const socketIds = this.userSockets.get(userId);
//     if (!socketIds) return [];
    
//     return Array.from(socketIds)
//       .map(socketId => this.server.sockets.sockets.get(socketId))
//       .filter(Boolean) as Socket[];
//   }

//   // === Chat Events ===

//   notifyNewMessage(chatId: string, message: any) {
//     this.server.to(chatId).emit('new-message', message);
//   }

//   notifyChatUpdate(userId: string, chat: any) {
//     this.getUserSockets(userId).forEach(socket => {
//       socket.emit('chat-update', chat);
//     });
//   }
// }
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';
// import * as cookieParser from 'cookie-parser';
// import * as dotenv from 'dotenv';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import { SocketService } from './socket/socket.service';

// dotenv.config();

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
  
//   // Create HTTP server
//   const httpServer = createServer(app.getHttpAdapter().getInstance());
  
//   // Create Socket.IO server
//   const io = new Server(httpServer, {
//     cors: {
//       origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//       credentials: true,
//     }
//   });

//   app.useGlobalPipes(new ValidationPipe());
//   app.use(cookieParser());

//   app.enableCors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true,
//   });

//   const socketService = app.get(SocketService);
//   socketService.io = io;

//   // Track connected users
//   const connectedUsers = new Map<string, string>(); // socketId -> userId

//   // Socket.IO connection handler
//   io.on('connection', (socket) => {
//     console.log('Client connected:', socket.id);

//     // Listen for authentication
//     socket.on('authenticate', (userId: string) => {
//       connectedUsers.set(socket.id, userId);
//       console.log(`User ${userId} authenticated with socket ${socket.id}`);
//     });

//     // Join a chat room
//     socket.on('joinChat', (chatId: string) => {
//       socket.join(chatId);
//       console.log(`Socket ${socket.id} joined chat ${chatId}`);
//     });

//     // Leave a chat room
//     socket.on('leaveChat', (chatId: string) => {
//       socket.leave(chatId);
//       console.log(`Socket ${socket.id} left chat ${chatId}`);
//     });

//     // Handle new messages
//     socket.on('sendMessage', (data: { chatId: string; message: any }) => {
//       const { chatId, message } = data;
//       io.to(chatId).emit('newMessage', message);
//       console.log(`Message sent to chat ${chatId}`);
//     });

//     socket.on('disconnect', () => {
//       connectedUsers.delete(socket.id);
//       console.log('Client disconnected:', socket.id);
//     });
//   });

//   // Start listening
//   await app.init();
//   httpServer.listen(process.env.PORT || 8000, () => {
//     console.log(`Server running on port ${process.env.PORT || 8000}`);
//   });
// }
// bootstrap();









import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SocketService } from './socket/socket.service';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Create HTTP server
  const httpServer = createServer(app.getHttpAdapter().getInstance());
  
  // Enhanced Socket.IO configuration
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    maxHttpBufferSize: 1e8, // 100MB for potential large data transfers
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    }
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  const socketService = app.get(SocketService);
  socketService.io = io;

  // Track connected users and their sockets
  const userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Authentication handler
    socket.on('authenticate', (userId: string) => {
      if (!userId) {
        socket.disconnect();
        return;
      }

      // Track user's sockets
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)?.add(socket.id);

      // Join user's personal room
      socket.join(`user_${userId}`);
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
    });

    // WebRTC signaling handlers
    socket.on('call-user', (data: { targetUserId: string; offer: RTCSessionDescriptionInit; callerId: string }) => {
      const callerId = Array.from(userSockets.entries())
        .find(([_, sockets]) => sockets.has(socket.id))?.[0];
      
      if (!callerId || callerId !== data.callerId) {
        console.warn(`Unauthorized call attempt from ${socket.id}`);
        return;
      }

      io.to(`user_${data.targetUserId}`).emit('incoming-call', {
        from: callerId,
        offer: data.offer,
      });
    });

    socket.on('answer-call', (data: { targetUserId: string; answer: RTCSessionDescriptionInit }) => {
      const answererId = Array.from(userSockets.entries())
        .find(([_, sockets]) => sockets.has(socket.id))?.[0];
      
      if (!answererId) {
        console.warn(`Unauthorized answer attempt from ${socket.id}`);
        return;
      }

      io.to(`user_${data.targetUserId}`).emit('call-answered', {
        from: answererId,
        answer: data.answer,
      });
    });

    socket.on('ice-candidate', (data: { targetUserId: string; candidate: RTCIceCandidateInit }) => {
      const senderId = Array.from(userSockets.entries())
        .find(([_, sockets]) => sockets.has(socket.id))?.[0];
      
      if (!senderId) {
        console.warn(`Unauthorized ICE candidate from ${socket.id}`);
        return;
      }

      io.to(`user_${data.targetUserId}`).emit('ice-candidate', {
        from: senderId,
        candidate: data.candidate,
      });
    });

    socket.on('end-call', (data: { targetUserId: string }) => {
      const callerId = Array.from(userSockets.entries())
        .find(([_, sockets]) => sockets.has(socket.id))?.[0];
      
      if (!callerId) {
        console.warn(`Unauthorized end-call from ${socket.id}`);
        return;
      }

      io.to(`user_${data.targetUserId}`).emit('call-ended', {
        from: callerId,
      });
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      const userId = Array.from(userSockets.entries())
        .find(([_, sockets]) => sockets.has(socket.id))?.[0];
      
      if (userId) {
        userSockets.get(userId)?.delete(socket.id);
        if (userSockets.get(userId)?.size === 0) {
          userSockets.delete(userId);
        }
        console.log(`User ${userId} disconnected socket ${socket.id}`);
      }
    });
  });

  await app.init();
  httpServer.listen(process.env.PORT || 8000, () => {
    console.log(`Server running on port ${process.env.PORT || 8000}`);
  });
}
bootstrap();
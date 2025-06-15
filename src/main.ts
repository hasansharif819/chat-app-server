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
  
  // Create Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    }
  });

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const socketService = app.get(SocketService);
  socketService.io = io;

  // Track connected users
  const connectedUsers = new Map<string, string>(); // socketId -> userId

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Listen for authentication
    socket.on('authenticate', (userId: string) => {
      connectedUsers.set(socket.id, userId);
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
    });

    // Join a chat room
    socket.on('joinChat', (chatId: string) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });

    // Leave a chat room
    socket.on('leaveChat', (chatId: string) => {
      socket.leave(chatId);
      console.log(`Socket ${socket.id} left chat ${chatId}`);
    });

    // Handle new messages
    socket.on('sendMessage', (data: { chatId: string; message: any }) => {
      const { chatId, message } = data;
      io.to(chatId).emit('newMessage', message);
      console.log(`Message sent to chat ${chatId}`);
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      console.log('Client disconnected:', socket.id);
    });
  });

  // Start listening
  await app.init();
  httpServer.listen(process.env.PORT || 8000, () => {
    console.log(`Server running on port ${process.env.PORT || 8000}`);
  });
}
bootstrap();
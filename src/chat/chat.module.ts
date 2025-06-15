import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { SocketService } from '../socket/socket.service';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [PrismaModule, AuthModule, SocketModule],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
})
export class ChatModule {}
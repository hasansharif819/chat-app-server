import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { ChatModule } from './chat/chat.module';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './events/events.gateway';
import { Server } from 'socket.io';
import { SocketService } from './socket/socket.service';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    // ConfigModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    PostModule,
    ChatModule,
    SocketModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway, SocketService],
  exports: [SocketService],
})

export class AppModule {}
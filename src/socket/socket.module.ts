import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';

@Module({
  providers: [SocketService],
  exports: [SocketService], // This makes SocketService available to other modules
})
export class SocketModule {}
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private postService: PostService) {}

  @Post()
  async createPost(@GetUser() user: User, @Body() data: any) {
    return this.postService.createPost(user.id, data);
  }

  @Get()
  async getPosts(@GetUser() user: User) {
    return this.postService.getPosts(user.id);
  }

  @Post(':id/like')
  async likePost(@GetUser() user: User, @Param('id') postId: string) {
    return this.postService.likePost(user.id, postId);
  }

  @Post(':id/comment')
  async commentOnPost(
    @GetUser() user: User,
    @Param('id') postId: string,
    @Body() body: { content: string },
  ) {
    return this.postService.commentOnPost(user.id, postId, body.content);
  }
}
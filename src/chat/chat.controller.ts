import { Controller, Get, Param, UseGuards, Post, Body, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) { }

  @Post('create')
  async sendMessage(
    @GetUser() user: User,
    @Body() dto: SendMessageDto
  ) {
    // console.log("Chats/create === ", user)
    return this.chatService.sendMessage(user.id, dto.receiverId, dto.content);
  }

  @Get()
  async getChats(@GetUser() user: User) {
    return this.chatService.getChats(user.id);
  }

  @Get(':userId')
  async getOrCreateChat(@GetUser() user: User, @Param('userId') userId: string) {
    return this.chatService.getOrCreateChat(user.id, userId);
  }

  // @Get(':chatId/messages')
  // async getMessages(@Param('chatId') chatId: string) {
  //   return this.chatService.getMessages(chatId);
  // }

  @Get(':chatId/messages')
  async getMessages(
    @Param('chatId') chatId: string,
    @Req() req, // Add request object to access user
  ) {
    return this.chatService.getMessages(chatId, req.user.id);
  }

  @Post(':chatId/read')
  async markMessagesAsRead(
    @GetUser() user: User,
    @Param('chatId') chatId: string,
  ) {
    return this.chatService.markMessagesAsRead(chatId, user.id);
  }
}
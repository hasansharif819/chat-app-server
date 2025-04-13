import { Controller, Get, Param, Put, Body, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get('me')
  async getProfile(@GetUser() user: User) {
    return this.userService.findOne(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put('me')
  async updateProfile(@GetUser() user: User, @Body() data: any) {
    return this.userService.updateProfile(user.id, data);
  }

  @Get('me/connections')
  async getConnections(@GetUser() user: User) {
    return this.userService.getConnections(user.id);
  }

  @Post('connections/:userId')
  async requestConnection(@GetUser() user: User, @Param('userId') userId: string) {
    return this.userService.requestConnection(user.id, userId);
  }

  @Post('connections/:id/respond')
  async respondToConnection(
    @Param('id') id: string,
    @Body() body: { status: 'accepted' | 'rejected' },
  ) {
    return this.userService.respondToConnection(id, body.status);
  }
}
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to database! ✅');
    } catch (error) {
      console.error('Failed to connect to database ❌', error);
    } finally {
      await this.$disconnect();
    }
  }
}

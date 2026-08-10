import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connected successfully.');
    } catch (error) {
      console.warn('Could not connect to database on startup. Using offline/mock state where needed.', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

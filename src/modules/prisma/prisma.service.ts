import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaMariaDb({
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT) || 3306,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      connectionLimit: 5,
      allowPublicKeyRetrieval: true,
    });
    const urlDb = `mysql://${process.env.DATABASE_USER}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
    console.log('Database URL:', urlDb);

    super({ adapter });
  }

  async onModuleInit() {
    console.log('Connecting to the database...');
    const urlDb = `mysql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;
    console.log('Database URL:', urlDb);
    await this.$connect();

    console.log('Connected to the database!');
  }
  async onModuleDestroy() {
    console.log('Disconnecting from the database...');
    await this.$disconnect();
  }
}

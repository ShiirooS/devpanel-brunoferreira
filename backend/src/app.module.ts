import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { validateEnv } from './config/env.validation.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    // The single .env lives at the repo root; the API process runs from backend/.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'], validate: validateEnv }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DashboardModule,
  ],
})
export class AppModule {}

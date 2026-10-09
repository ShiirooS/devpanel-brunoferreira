import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { UserStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser, JwtPayload } from './auth.types.js';

const AUTH_USER_SELECT = { id: true, email: true, name: true, role: true, status: true } as const;

@Injectable()
export class AuthService {
  // Verified against when the email is unknown, so response time doesn't reveal which emails exist.
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const record = await this.prisma.user.findUnique({ where: { email } });

    const hash = record?.passwordHash ?? (await this.getDummyHash());
    const passwordMatches = await argon2.verify(hash, password);

    // Same error for unknown email, wrong password and non-ACTIVE accounts.
    if (!record || !passwordMatches || record.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({ where: { id: record.id }, data: { lastLoginAt: new Date() } });

    const payload: JwtPayload = { sub: record.id, role: record.role };
    const token = await this.jwt.signAsync(payload);
    const { id, name, role, status } = record;
    return { user: { id, email: record.email, name, role, status }, token };
  }

  /** Reloads the user from the database so status/role changes apply immediately. */
  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: AUTH_USER_SELECT });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash('dummy-password-for-timing', { type: argon2.argon2id });
    return this.dummyHash;
  }
}

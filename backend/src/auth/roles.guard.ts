import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Role, UserStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { JwtPayload } from './auth.types.js';
import { ROLES_KEY } from './roles.decorator.js';

/** Runs after JwtAuthGuard. Authorization is enforced here, never only in the frontend. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }

    const payload = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>().user;
    if (!payload) {
      throw new UnauthorizedException();
    }

    // The role is re-read from the database, not trusted from the token, so a demotion or
    // suspension takes effect immediately instead of when the JWT expires.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, status: true },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}

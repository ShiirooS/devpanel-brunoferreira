import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from './auth.types.js';

export type AuthenticatedRequest = Request & { user: JwtPayload };

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtPayload => {
  return ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
});

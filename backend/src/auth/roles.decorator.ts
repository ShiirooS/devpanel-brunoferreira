import { SetMetadata } from '@nestjs/common';
import type { Role } from '../generated/prisma/client.js';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given roles. Routes without it only require authentication. */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);

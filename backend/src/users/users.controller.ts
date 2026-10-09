import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';
import { Roles } from '../auth/roles.decorator.js';
import { ListUsersQuery } from './dto/list-users.query.js';
import { UsersService, type UsersPage } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles(Role.ADMIN, Role.EDITOR)
  @Get()
  list(@Query() query: ListUsersQuery): Promise<UsersPage> {
    return this.users.list(query);
  }
}

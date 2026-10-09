import { Controller, Get, Query } from '@nestjs/common';
import { ListUsersQuery } from './dto/list-users.query.js';
import { UsersService, type UsersPage } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQuery): Promise<UsersPage> {
    return this.users.list(query);
  }
}

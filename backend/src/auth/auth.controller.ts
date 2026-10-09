import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { SESSION_COOKIE, type AuthUser, type JwtPayload } from './auth.types.js';
import { CurrentUser } from './current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<{ user: AuthUser }> {
    const { user, token } = await this.auth.login(dto.email, dto.password);
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: this.config.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS') * 1000,
    });
    return { user };
  }

  @Get('me')
  async me(@CurrentUser() current: JwtPayload): Promise<{ user: AuthUser }> {
    return { user: await this.auth.getCurrentUser(current.sub) };
  }

  /** Clears the cookie. The JWT itself is stateless and stays valid until it expires (documented limitation). */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', path: '/' });
  }
}

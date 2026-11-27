import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser, Public, Roles } from './auth.decorators';
import type { AuthenticatedUser } from './auth.identity';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(ThrottlerGuard)
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @Roles('admin', 'manager')
  @Header('Cache-Control', 'no-store')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user);
  }
}

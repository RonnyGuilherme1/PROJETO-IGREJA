import {
  Body,
  Controller,
  ExecutionContext,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle, minutes } from '@nestjs/throttler';

import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { MasterLoginDto } from './dto/master-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './types/authenticated-user.type';

const resolveLoginThrottleLimit = (_context: ExecutionContext): number =>
  process.env.NODE_ENV === 'production' ? 5 : 20;

const resolveLoginBlockDuration = (_context: ExecutionContext): number =>
  process.env.NODE_ENV === 'production' ? minutes(15) : minutes(1);

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      ttl: minutes(1),
      limit: resolveLoginThrottleLimit,
      blockDuration: resolveLoginBlockDuration,
    },
  })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('master/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      ttl: minutes(1),
      limit: resolveLoginThrottleLimit,
      blockDuration: resolveLoginBlockDuration,
    },
  })
  masterLogin(
    @Body() masterLoginDto: MasterLoginDto,
  ): Promise<LoginResponseDto> {
    return this.authService.masterLogin(masterLoginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserDto> {
    return this.authService.getProfile(user);
  }
}

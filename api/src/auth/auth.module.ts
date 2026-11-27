import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { readApiEnvironment } from '../config/environment';
import { User } from '../database/entities/user.entity';
import { AuthController } from './auth.controller';
import { jwtAudience, jwtIssuer } from './auth.identity';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      useFactory: (): JwtModuleOptions => {
        const { jwtSecret, jwtExpiresInSeconds } = readApiEnvironment(
          process.env,
        );
        return {
          secret: jwtSecret,
          signOptions: {
            algorithm: 'HS256',
            expiresIn: jwtExpiresInSeconds,
            issuer: jwtIssuer,
            audience: jwtAudience,
          },
          verifyOptions: {
            algorithms: ['HS256'],
            ignoreExpiration: false,
            issuer: jwtIssuer,
            audience: jwtAudience,
          },
        };
      },
    }),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 10, blockDuration: 60_000 },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}

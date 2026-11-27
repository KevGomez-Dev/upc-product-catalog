import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { publicRoute } from './auth.decorators';
import type { AuthenticatedRequest, AuthenticatedUser } from './auth.identity';

const maxUserId = 2147483647; // PostgreSQL integer

function readIdentity(claims: object | null): AuthenticatedUser | undefined {
  if (!claims || typeof claims !== 'object') return undefined;

  const { sub, role, iat, exp } = claims as Record<string, unknown>;
  const id = typeof sub === 'string' ? Number(sub) : Number.NaN;
  if (
    !Number.isInteger(id) ||
    id < 1 ||
    id > maxUserId ||
    String(id) !== sub ||
    (role !== 'admin' && role !== 'manager') ||
    typeof iat !== 'number' ||
    !Number.isSafeInteger(iat) ||
    iat <= 0 ||
    iat > Math.floor(Date.now() / 1000) ||
    typeof exp !== 'number' ||
    !Number.isSafeInteger(exp) ||
    exp <= iat
  ) {
    return undefined;
  }

  return { id, role };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.get<boolean>(publicRoute, context.getHandler()))
      return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token =
      /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(
        header ?? '',
      )?.[1];
    if (!token) throw new UnauthorizedException();

    let claims: object;
    try {
      claims = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }

    const user = readIdentity(claims);
    if (!user) throw new UnauthorizedException();
    request.authUser = user;
    return true;
  }
}

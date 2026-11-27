import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../database/entities/user.entity';
import { allowedRoles, publicRoute } from './auth.decorators';
import type { AuthenticatedRequest } from './auth.identity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.reflector.get<boolean>(publicRoute, context.getHandler()))
      return true;

    const { authUser } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (!authUser) throw new UnauthorizedException();

    const roles = this.reflector.getAllAndOverride<UserRole[]>(allowedRoles, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.includes(authUser.role)) throw new ForbiddenException();
    return true;
  }
}

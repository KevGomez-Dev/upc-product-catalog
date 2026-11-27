import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import type { UserRole } from '../database/entities/user.entity';
import type { AuthenticatedRequest, AuthenticatedUser } from './auth.identity';

export const publicRoute = Symbol('publicRoute');
export const allowedRoles = Symbol('allowedRoles');

export const Public = (): MethodDecorator => SetMetadata(publicRoute, true);
export const Roles = (...roles: UserRole[]) => SetMetadata(allowedRoles, roles);

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedUser => {
    const { authUser } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (!authUser) throw new UnauthorizedException();
    return authUser;
  },
);

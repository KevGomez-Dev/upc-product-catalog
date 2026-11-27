import type { UserRole } from '../database/entities/user.entity';

export interface AuthenticatedUser {
  id: number;
  role: UserRole;
}

export interface AuthenticatedRequest {
  headers: { authorization?: string };
  authUser?: AuthenticatedUser;
}

export const jwtIssuer = 'catalogo-productos-upc-api';
export const jwtAudience = 'catalogo-productos-upc';

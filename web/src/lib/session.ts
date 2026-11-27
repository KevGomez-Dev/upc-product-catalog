import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';
import { backend, webOrigin } from './backend';
import type { Profile } from './contracts';

export const sessionCookie = 'upc_session';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: webOrigin.startsWith('https://'),
} as const;

export function setSession(response: NextResponse, token: string): boolean {
  try {
    const segments = token.split('.');
    if (
      segments.length !== 3 ||
      segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))
    )
      return false;
    const claims: { exp?: unknown } = JSON.parse(
      Buffer.from(segments[1], 'base64url').toString('utf8'),
    );
    if (
      typeof claims.exp !== 'number' ||
      !Number.isSafeInteger(claims.exp) ||
      claims.exp <= Math.floor(Date.now() / 1000)
    )
      return false;
    // Leave room for the HTTP Date header's precision when browsers adjust expiry.
    const expires = new Date((claims.exp - 2) * 1000);
    if (!(expires.getTime() > Date.now())) return false;
    response.cookies.set(sessionCookie, token, { ...cookieOptions, expires });
    return true;
  } catch {
    return false;
  }
}

export function clearSession(response: NextResponse) {
  response.cookies.set(sessionCookie, '', { ...cookieOptions, maxAge: 0 });
}

export async function sessionToken() {
  return (await cookies()).get(sessionCookie)?.value;
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const token = await sessionToken();
  if (!token) return null;
  const response = await backend('/auth/me', { token });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('No se pudo consultar la sesión.');
  const data: Partial<Profile> = await response.json();
  if (
    !Number.isInteger(data.id) ||
    typeof data.username !== 'string' ||
    (data.role !== 'admin' && data.role !== 'manager')
  ) {
    throw new Error('El perfil no es válido.');
  }
  return { id: data.id!, username: data.username, role: data.role };
});

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== 'admin') redirect('/products?forbidden=1');
}

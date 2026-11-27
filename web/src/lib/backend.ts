import 'server-only';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { configuredOrigin } from './origins';

const apiOrigin = configuredOrigin('API_BASE_URL', 'http://127.0.0.1:3000');
export const webOrigin = configuredOrigin(
  'WEB_ORIGIN',
  'http://127.0.0.1:3001',
);
export const privateHeaders = { 'Cache-Control': 'private, no-store' };
type BackendPath =
  | '/auth/login'
  | '/auth/me'
  | '/products'
  | `/products/${number}`
  | '/categories'
  | `/categories/${string}/subcategories`;

export async function backend(
  path: BackendPath,
  options: { method?: string; token?: string; body?: string } = {},
) {
  return fetch(`${apiOrigin}${path}`, {
    method: options.method,
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });
}

export function problem(statusCode: number, code: string, message: string) {
  return NextResponse.json(
    { statusCode, code, message, requestId: randomUUID() },
    {
      status: statusCode,
      headers: privateHeaders,
    },
  );
}

export function originProblem(request: Request) {
  return request.headers.get('origin') === webOrigin
    ? null
    : problem(
        403,
        'ORIGIN_FORBIDDEN',
        'El origen de la solicitud no está autorizado.',
      );
}

export function unavailable() {
  return problem(
    502,
    'UPSTREAM_UNAVAILABLE',
    'No se pudo conectar con el catálogo. Intenta de nuevo.',
  );
}

export function forward(response: Response) {
  const headers = new Headers(privateHeaders);
  for (const name of [
    'Content-Type',
    'Retry-After',
    'X-UPC-Warning',
    'Location',
  ]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new NextResponse(response.body, { status: response.status, headers });
}

export async function readJson(request: Request): Promise<string | null> {
  if (
    request.headers.get('content-type')?.split(';')[0].trim() !==
    'application/json'
  )
    return null;
  try {
    return JSON.stringify(await request.json());
  } catch {
    return null;
  }
}

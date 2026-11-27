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

const maximumJsonBytes = 100 * 1024;

export async function readJson(
  request: Request,
): Promise<string | NextResponse> {
  const invalid = () =>
    problem(400, 'BAD_REQUEST', 'Envía los datos como JSON.');
  const mediaType = request.headers
    .get('content-type')
    ?.split(';')[0]
    .trim()
    .toLowerCase();
  if (mediaType !== 'application/json' || !request.body) return invalid();

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let body = '';
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maximumJsonBytes) {
        void reader.cancel().catch(() => {});
        return problem(
          413,
          'PAYLOAD_TOO_LARGE',
          'El cuerpo de la solicitud supera el límite.',
        );
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    JSON.parse(body);
    return body;
  } catch {
    void reader.cancel().catch(() => {});
    return invalid();
  } finally {
    reader.releaseLock();
  }
}

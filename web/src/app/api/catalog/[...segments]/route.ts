import {
  backend,
  forward,
  originProblem,
  problem,
  readJson,
  unavailable,
} from '../../../../lib/backend';
import { isProductId } from '../../../../lib/contracts';
import { clearSession, sessionToken } from '../../../../lib/session';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Context = { params: Promise<{ segments: string[] }> };

function resolvePath(
  method: Method,
  segments: string[],
): Parameters<typeof backend>[0] | null {
  const [resource, id, child] = segments;
  if (resource === 'products') {
    if (segments.length === 1 && (method === 'GET' || method === 'POST'))
      return '/products';
    if (segments.length === 2 && method !== 'POST' && isProductId(id))
      return `/products/${Number(id)}`;
  }
  if (resource === 'categories' && method === 'GET') {
    if (segments.length === 1) return '/categories';
    if (
      segments.length === 3 &&
      child === 'subcategories' &&
      id !== '.' &&
      id !== '..' &&
      !/[\\/]/.test(id)
    ) {
      return `/categories/${encodeURIComponent(id)}/subcategories`;
    }
  }
  return null;
}

async function handle(method: Method, request: Request, context: Context) {
  const denied = method !== 'GET' ? originProblem(request) : null;
  if (denied) return denied;

  const path = resolvePath(method, (await context.params).segments);
  if (!path) return problem(404, 'NOT_FOUND', 'El recurso no existe.');
  const token = await sessionToken();
  if (!token)
    return problem(401, 'UNAUTHORIZED', 'Se requiere una sesión válida.');
  let body: string | undefined;
  if (method === 'POST' || method === 'PUT') {
    const json = await readJson(request);
    if (typeof json !== 'string') return json;
    body = json;
  }
  try {
    const result = await backend(path, { method, token, body });
    const response = forward(result);
    if (result.status === 401) clearSession(response);
    return response;
  } catch {
    return unavailable();
  }
}

export const GET = (request: Request, context: Context) =>
  handle('GET', request, context);
export const POST = (request: Request, context: Context) =>
  handle('POST', request, context);
export const PUT = (request: Request, context: Context) =>
  handle('PUT', request, context);
export const DELETE = (request: Request, context: Context) =>
  handle('DELETE', request, context);

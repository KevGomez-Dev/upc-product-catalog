import type { ErrorBody } from './contracts';

export class RequestError extends Error {
  constructor(readonly details: ErrorBody) {
    super(details.message);
  }
}

export async function request<T>(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      cache: 'no-store',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new RequestError({
      statusCode: 0,
      code: 'NETWORK',
      message: 'No se pudo conectar. Comprueba tu conexión e intenta de nuevo.',
    });
  }

  if (response.status === 204) return { data: undefined as T, warning: false };
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const details = body as Partial<ErrorBody> | null;
    const statusCode = response.status;
    if (statusCode === 401 && path.startsWith('/api/catalog/'))
      window.location.replace('/login?expired=1');
    throw new RequestError({
      statusCode,
      code: details?.code ?? 'HTTP_ERROR',
      message:
        statusCode === 429
          ? 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.'
          : (details?.message ??
            'No se pudo completar la operación. Intenta de nuevo.'),
      fieldErrors: details?.fieldErrors,
      requestId: details?.requestId,
    });
  }
  if (body === null)
    throw new RequestError({
      statusCode: 502,
      code: 'BAD_RESPONSE',
      message: 'El catálogo devolvió una respuesta inesperada.',
    });
  return {
    data: body as T,
    warning: response.headers.get('X-UPC-Warning') === 'UPC_CHECKSUM',
  };
}

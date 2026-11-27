import { NextResponse } from 'next/server';
import {
  backend,
  forward,
  originProblem,
  privateHeaders,
  problem,
  readJson,
  unavailable,
} from '../../../lib/backend';
import { setSession } from '../../../lib/session';

export async function POST(request: Request) {
  const denied = originProblem(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (body === null)
    return problem(400, 'BAD_REQUEST', 'Envía los datos como JSON.');
  try {
    const result = await backend('/auth/login', { method: 'POST', body });
    if (!result.ok) return forward(result);
    const session: { accessToken?: unknown } = await result.json();
    const response = new NextResponse(null, {
      status: 204,
      headers: privateHeaders,
    });
    return typeof session.accessToken === 'string' &&
      setSession(response, session.accessToken)
      ? response
      : unavailable();
  } catch {
    return unavailable();
  }
}

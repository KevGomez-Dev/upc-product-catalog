import { NextResponse } from 'next/server';
import { originProblem, privateHeaders } from '../../../../lib/backend';
import { clearSession } from '../../../../lib/session';

export async function POST(request: Request) {
  const denied = originProblem(request);
  if (denied) return denied;
  const response = new NextResponse(null, {
    status: 204,
    headers: privateHeaders,
  });
  clearSession(response);
  return response;
}

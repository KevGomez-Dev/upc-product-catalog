'use client';

import { useEffect, useState } from 'react';
import { request, RequestError } from './client';

type Resource<T> = { data?: T; error?: RequestError; loading: boolean };

export function useResource<T>(path: string | null) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ key: string; state: Resource<T> }>();
  const key = `${path ?? ''}:${version}`;

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    request<T>(path, { signal: controller.signal }).then(
      ({ data }) => {
        if (!controller.signal.aborted)
          setResult({ key, state: { data, loading: false } });
      },
      (error: RequestError) => {
        if (!controller.signal.aborted)
          setResult({ key, state: { error, loading: false } });
      },
    );
    return () => controller.abort();
  }, [key, path]);

  const state = result?.key === key ? result.state : { loading: path !== null };
  return { ...state, reload: () => setVersion((previous) => previous + 1) };
}

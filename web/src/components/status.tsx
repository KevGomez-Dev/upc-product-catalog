'use client';

import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Loading({ children = 'Cargando…' }: { children?: ReactNode }) {
  return (
    <div className="state-box" role="status">
      <LoaderCircle size={19} className="spin" aria-hidden />
      {children}
    </div>
  );
}

export function Notice({
  children,
  tone = 'error',
  dismiss,
}: {
  children: ReactNode;
  tone?: 'error' | 'success' | 'warning';
  dismiss?: () => void;
}) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={`notice notice-${tone}`}
      role={tone === 'success' ? 'status' : 'alert'}
    >
      <Icon size={18} aria-hidden />
      <div>{children}</div>
      {dismiss && (
        <button
          type="button"
          className="icon-button"
          aria-label="Cerrar aviso"
          onClick={dismiss}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function LoadError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <Notice>
      <p>{message}</p>
      <button className="text-action" type="button" onClick={retry}>
        Reintentar
      </button>
    </Notice>
  );
}

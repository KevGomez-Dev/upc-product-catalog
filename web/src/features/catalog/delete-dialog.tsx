'use client';

import { useEffect, useRef, useState } from 'react';
import { Notice } from '../../components/status';
import { request, RequestError } from '../../lib/client';
import type { Product } from '../../lib/contracts';

export function DeleteDialog({
  product,
  onCancel,
  onDeleted,
}: {
  product: Product;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const errorBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    cancelButton.current?.focus();
    return () => {
      if (element?.open) element.close();
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus();
    };
  }, []);

  useEffect(() => {
    if (error) errorBox.current?.focus();
  }, [error]);

  async function confirm() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await request<void>(`/api/catalog/products/${product.id}`, {
        method: 'DELETE',
      });
      onDeleted();
    } catch (failure) {
      setError(
        failure instanceof RequestError
          ? failure.message
          : 'No se pudo eliminar el producto.',
      );
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending.current) onCancel();
      }}
    >
      <h2 id="delete-title">Eliminar producto</h2>
      <p id="delete-description">
        ¿Quieres eliminar <strong>{product.upcDescription}</strong>? UPC{' '}
        <span className="upc">{product.upcCode}</span>.
      </p>
      {error && (
        <div tabIndex={-1} ref={errorBox}>
          <Notice>{error}</Notice>
        </div>
      )}
      <div className="form-actions">
        <button
          ref={cancelButton}
          type="button"
          className="button"
          disabled={busy}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="button button-danger"
          disabled={busy}
          onClick={confirm}
        >
          {busy ? 'Eliminando…' : 'Eliminar producto'}
        </button>
      </div>
    </dialog>
  );
}

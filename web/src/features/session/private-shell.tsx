'use client';

import Link from 'next/link';
import { Barcode, Boxes, LogOut } from 'lucide-react';
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Notice } from '../../components/status';
import { request, RequestError } from '../../lib/client';
import type { Profile } from '../../lib/contracts';

type Flash = { message: string; warning?: boolean };
const FlashContext = createContext<(notice: Flash) => void>(() => {});

export function useFlash() {
  return useContext(FlashContext);
}

export function PrivateShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  const [flash, setFlash] = useState<Flash>();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  async function logout() {
    if (lock.current) return;
    lock.current = true;
    setLeaving(true);
    setError('');
    try {
      await request<void>('/api/session/logout', { method: 'POST' });
      window.location.replace('/login');
    } catch (failure) {
      setError(
        failure instanceof RequestError
          ? failure.message
          : 'No se pudo cerrar la sesión.',
      );
      lock.current = false;
      setLeaving(false);
    }
  }

  return (
    <FlashContext.Provider value={setFlash}>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <div className="shell">
        <aside className="sidebar">
          <Link href="/products" className="brand">
            <span className="brand-icon">
              <Barcode size={22} />
            </span>{' '}
            Catálogo UPC
          </Link>
          <nav aria-label="Navegación principal">
            <Link className="nav-link" href="/products">
              <Boxes size={19} aria-hidden /> Productos
            </Link>
          </nav>
          <div className="account">
            <div className="account-profile">
              <strong>{profile.username}</strong>
              <span>
                {profile.role === 'admin' ? 'Administrador' : 'Manager'}
              </span>
            </div>
            <button
              type="button"
              className="logout-button"
              disabled={leaving}
              onClick={logout}
            >
              <LogOut size={17} aria-hidden />
              {leaving ? 'Cerrando…' : 'Cerrar sesión'}
            </button>
          </div>
        </aside>
        <main className="main-content" id="main">
          {error && <Notice dismiss={() => setError('')}>{error}</Notice>}
          {flash && (
            <div className="flash-group">
              <Notice tone="success" dismiss={() => setFlash(undefined)}>
                {flash.message}
              </Notice>
              {flash.warning && (
                <Notice tone="warning">
                  El producto se guardó. El dígito de control del UPC es
                  incorrecto.
                </Notice>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </FlashContext.Provider>
  );
}

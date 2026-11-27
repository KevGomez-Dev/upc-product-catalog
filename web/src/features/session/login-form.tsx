'use client';

import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Notice } from '../../components/status';
import { request, RequestError } from '../../lib/client';

export function LoginForm({ expired }: { expired: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const lock = useRef(false);
  const errorArea = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorArea.current?.focus();
  }, [error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const username = String(data.get('username') ?? '');
    const password = String(data.get('password') ?? '');
    const next: Record<string, string> = {};
    if (!username.trim()) next.username = 'Ingresa tu usuario.';
    if (!password) next.password = 'Ingresa tu contraseña.';
    setFields(next);
    setError('');
    const first = Object.keys(next)[0];
    if (first) {
      form.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }

    lock.current = true;
    setSending(true);
    try {
      await request<void>('/api/session', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      window.location.replace('/products');
    } catch (failure) {
      setError(
        failure instanceof RequestError
          ? failure.message
          : 'No se pudo iniciar sesión.',
      );
      lock.current = false;
      setSending(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      {expired && (
        <Notice tone="warning">
          Tu sesión venció. Inicia sesión para continuar.
        </Notice>
      )}
      {error && (
        <div tabIndex={-1} ref={errorArea}>
          <Notice>{error}</Notice>
        </div>
      )}
      <div className="form-field">
        <label htmlFor="username">Usuario</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          maxLength={254}
          placeholder="Nombre de usuario"
          required
          aria-invalid={!!fields.username}
          aria-describedby={fields.username ? 'username-error' : undefined}
        />
        {fields.username && (
          <p className="field-error" id="username-error">
            {fields.username}
          </p>
        )}
      </div>
      <div className="form-field">
        <label htmlFor="password">Contraseña</label>
        <div className="password-field">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            maxLength={256}
            placeholder="Tu contraseña"
            required
            aria-invalid={!!fields.password}
            aria-describedby={fields.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            className="icon-button"
            aria-label={
              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {fields.password && (
          <p className="field-error" id="password-error">
            {fields.password}
          </p>
        )}
      </div>
      <button
        className="button button-primary login-submit"
        type="submit"
        disabled={sending}
      >
        {sending ? 'Ingresando…' : 'Iniciar sesión'}
        {sending ? (
          <LoaderCircle size={17} className="spin" />
        ) : (
          <ArrowRight size={17} />
        )}
      </button>
    </form>
  );
}

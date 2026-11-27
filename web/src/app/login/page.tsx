import { Barcode } from 'lucide-react';
import { redirect } from 'next/navigation';
import { LoginForm } from '../../features/session/login-form';
import { getProfile } from '../../lib/session';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const [profile, query] = await Promise.all([getProfile(), searchParams]);
  if (profile) redirect('/products');
  return (
    <main className="login-layout">
      <aside className="login-brand">
        <div className="brand">
          <span className="brand-icon">
            <Barcode size={23} />
          </span>{' '}
          Catálogo UPC
        </div>
        <div className="login-brand-content">
          <div className="barcode-pattern" aria-hidden />
          <h2>Catálogo de productos</h2>
          <p>Consulta y gestiona productos identificados por su código UPC.</p>
        </div>
      </aside>
      <section className="login-content" aria-labelledby="login-heading">
        <div className="login-panel">
          <h1 id="login-heading">Iniciar sesión</h1>
          <p className="muted">
            Ingresa tus credenciales para acceder al catálogo.
          </p>
          <LoginForm expired={query.expired === '1'} />
        </div>
      </section>
    </main>
  );
}

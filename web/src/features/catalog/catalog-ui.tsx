import Link from 'next/link';
import { ArrowLeft, PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';

export function CatalogHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export function BackToProducts() {
  return (
    <Link href="/products" className="back-link">
      <ArrowLeft size={16} aria-hidden /> Volver a productos
    </Link>
  );
}

export function UtcTime({ value }: { value: string }) {
  return (
    <time className="utc-time" dateTime={value}>
      {value.replace('T', ' ').replace(/Z$/, ' UTC')}
    </time>
  );
}

export function EmptyProducts({ filtered = false }: { filtered?: boolean }) {
  return (
    <div className="state-box">
      <PackageOpen size={21} aria-hidden />
      {filtered
        ? 'No hay productos que coincidan con los filtros.'
        : 'Todavía no hay productos en el catálogo.'}
    </div>
  );
}

export function MissingProduct() {
  return (
    <>
      <BackToProducts />
      <CatalogHeading
        title="Producto inexistente"
        description="El producto solicitado no está disponible en el catálogo."
      />
    </>
  );
}

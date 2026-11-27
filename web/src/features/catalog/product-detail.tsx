'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { LoadError, Loading } from '../../components/status';
import type { ProductDetail as Detail } from '../../lib/contracts';
import { useResource } from '../../lib/use-resource';
import { useFlash } from '../session/private-shell';
import {
  BackToProducts,
  CatalogHeading,
  MissingProduct,
  UtcTime,
} from './catalog-ui';
import { DeleteDialog } from './delete-dialog';

export function ProductDetail({ id, admin }: { id: string; admin: boolean }) {
  const {
    data: product,
    loading,
    error,
    reload,
  } = useResource<Detail>(`/api/catalog/products/${id}`);
  const [confirming, setConfirming] = useState(false);
  const flash = useFlash();
  const router = useRouter();

  if (error?.details.statusCode === 404) return <MissingProduct />;
  return (
    <>
      <BackToProducts />
      {loading ? (
        <Loading>Cargando producto…</Loading>
      ) : error ? (
        <LoadError message={error.message} retry={reload} />
      ) : (
        product && (
          <>
            <CatalogHeading
              title={product.upcDescription}
              description={`Producto #${product.id}`}
              actions={
                admin && (
                  <div className="heading-actions">
                    <Link
                      className="button button-primary"
                      href={`/products/${product.id}/edit`}
                    >
                      <Pencil size={17} aria-hidden /> Editar
                    </Link>
                    <button
                      type="button"
                      className="button danger-text"
                      onClick={() => setConfirming(true)}
                    >
                      <Trash2 size={17} aria-hidden /> Eliminar
                    </button>
                  </div>
                )
              }
            />
            <div className="detail-panels">
              <section className="panel detail-panel">
                <h2>Datos del producto</h2>
                <dl>
                  <div>
                    <dt>Descripción</dt>
                    <dd>{product.upcDescription}</dd>
                  </div>
                  <div>
                    <dt>UPC</dt>
                    <dd className="upc">{product.upcCode}</dd>
                  </div>
                  <div>
                    <dt>Categoría</dt>
                    <dd>{product.categoryCode}</dd>
                  </div>
                  <div>
                    <dt>Subcategoría</dt>
                    <dd>{product.subCategoryCode}</dd>
                  </div>
                </dl>
              </section>
              <section className="panel detail-panel">
                <h2>Auditoría</h2>
                <dl>
                  <div>
                    <dt>Fecha de alta</dt>
                    <dd>
                      <UtcTime value={product.dateAdded} />
                    </dd>
                  </div>
                  <div>
                    <dt>Autor del alta</dt>
                    <dd>{product.addedBy}</dd>
                  </div>
                  <div>
                    <dt>Fecha de última modificación</dt>
                    <dd>
                      <UtcTime value={product.updatedDate} />
                    </dd>
                  </div>
                  <div>
                    <dt>Autor de la última modificación</dt>
                    <dd>{product.modifiedBy}</dd>
                  </div>
                </dl>
              </section>
            </div>
            {confirming && (
              <DeleteDialog
                product={product}
                onCancel={() => setConfirming(false)}
                onDeleted={() => {
                  setConfirming(false);
                  flash({ message: 'Producto eliminado.' });
                  router.push('/products');
                }}
              />
            )}
          </>
        )
      )}
    </>
  );
}

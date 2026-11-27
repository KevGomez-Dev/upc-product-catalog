'use client';

import Link from 'next/link';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { LoadError, Loading, Notice } from '../../components/status';
import type { Product } from '../../lib/contracts';
import { useResource } from '../../lib/use-resource';
import { useFlash } from '../session/private-shell';
import { CatalogHeading, EmptyProducts, UtcTime } from './catalog-ui';
import { DeleteDialog } from './delete-dialog';

const collator = new Intl.Collator('es');
const uniqueSorted = (values: string[]) =>
  [...new Set(values)].sort(collator.compare);

export function ProductList({
  admin,
  forbidden,
}: {
  admin: boolean;
  forbidden: boolean;
}) {
  const { data, loading, error, reload } = useResource<Product[]>(
    '/api/catalog/products',
  );
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [selected, setSelected] = useState<Product>();
  const [showForbidden, setShowForbidden] = useState(forbidden);
  const listTop = useRef<HTMLDivElement>(null);
  const flash = useFlash();
  const products = data ?? [];
  const categories = uniqueSorted(products.map((item) => item.categoryCode));
  const subcategories = uniqueSorted(
    products
      .filter((item) => !category || item.categoryCode === category)
      .map((item) => item.subCategoryCode),
  );
  const query = search.trim().toLocaleLowerCase('es');
  const visible = products.filter(
    (item) =>
      (!category || item.categoryCode === category) &&
      (!subcategory || item.subCategoryCode === subcategory) &&
      (!query ||
        item.upcDescription.toLocaleLowerCase('es').includes(query) ||
        item.upcCode.includes(query)),
  );

  return (
    <>
      <CatalogHeading
        title="Productos"
        description="Consulta el catálogo por descripción, UPC o clasificación."
        actions={
          admin && (
            <Link href="/products/new" className="button button-primary">
              <Plus size={18} aria-hidden /> Nuevo producto
            </Link>
          )
        }
      />
      {showForbidden && (
        <Notice dismiss={() => setShowForbidden(false)}>
          Tu rol solo permite consultar productos.
        </Notice>
      )}
      <section className="panel" aria-label="Productos del catálogo">
        <div className="filters" ref={listTop} tabIndex={-1}>
          <label className="form-field search-field">
            <span>Buscar</span>
            <span className="search-input">
              <Search size={18} aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Descripción o UPC"
              />
            </span>
          </label>
          <label className="form-field">
            <span>Categoría</span>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setSubcategory('');
              }}
            >
              <option value="">Todas</option>
              {categories.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Subcategoría</span>
            <select
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
            >
              <option value="">Todas</option>
              {subcategories.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </label>
        </div>
        {loading ? (
          <Loading>Cargando productos…</Loading>
        ) : error ? (
          <div className="panel-message">
            <LoadError message={error.message} retry={reload} />
          </div>
        ) : (
          <>
            <p className="result-count" aria-live="polite">
              {visible.length === products.length
                ? `${products.length} productos`
                : `${visible.length} de ${products.length} productos`}
            </p>
            {visible.length === 0 ? (
              <EmptyProducts filtered={products.length > 0} />
            ) : (
              <div
                className="table-region"
                tabIndex={0}
                role="region"
                aria-label="Tabla de productos, desplazable horizontalmente"
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Descripción</th>
                      <th scope="col">UPC</th>
                      <th scope="col">Categoría</th>
                      <th scope="col">Subcategoría</th>
                      <th scope="col">Fecha de alta</th>
                      <th scope="col">Última modificación</th>
                      {admin && <th scope="col">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((product) => (
                      <tr key={product.id}>
                        <th scope="row">
                          <Link
                            className="product-link"
                            href={`/products/${product.id}`}
                          >
                            {product.upcDescription}
                          </Link>
                        </th>
                        <td className="upc">{product.upcCode}</td>
                        <td>{product.categoryCode}</td>
                        <td>{product.subCategoryCode}</td>
                        <td>
                          <UtcTime value={product.dateAdded} />
                        </td>
                        <td>
                          <UtcTime value={product.updatedDate} />
                        </td>
                        {admin && (
                          <td>
                            <div className="row-actions">
                              <Link
                                className="icon-button"
                                href={`/products/${product.id}/edit`}
                                aria-label={`Editar ${product.upcDescription}`}
                              >
                                <Pencil size={17} aria-hidden />
                              </Link>
                              <button
                                className="icon-button danger-text"
                                type="button"
                                aria-label={`Eliminar ${product.upcDescription}`}
                                onClick={() => setSelected(product)}
                              >
                                <Trash2 size={17} aria-hidden />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
      {selected && (
        <DeleteDialog
          product={selected}
          onCancel={() => setSelected(undefined)}
          onDeleted={() => {
            setSelected(undefined);
            flash({ message: 'Producto eliminado.' });
            reload();
            requestAnimationFrame(() => listTop.current?.focus());
          }}
        />
      )}
    </>
  );
}

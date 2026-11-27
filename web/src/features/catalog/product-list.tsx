'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import { LoadError, Loading, Notice } from '../../components/status';
import type { Product } from '../../lib/contracts';
import { useResource } from '../../lib/use-resource';
import { useFlash } from '../session/private-shell';
import { CatalogHeading, EmptyProducts } from './catalog-ui';
import { DeleteDialog } from './delete-dialog';
import { ProductListItems } from './product-list-items';

const pageSize = 20;
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
  const [page, setPage] = useState(1);
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
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const displayed = visible.slice(offset, offset + pageSize);

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
          <div className="form-field search-field">
            <label htmlFor="product-search">Buscar</label>
            <span className="search-input">
              <Search size={18} aria-hidden />
              <input
                id="product-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Descripción o UPC"
              />
            </span>
          </div>
          <div className="form-field">
            <label htmlFor="product-category">Categoría</label>
            <select
              id="product-category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setSubcategory('');
                setPage(1);
              }}
            >
              <option value="">Todas</option>
              {categories.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="product-subcategory">Subcategoría</label>
            <select
              id="product-subcategory"
              value={subcategory}
              onChange={(event) => {
                setSubcategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas</option>
              {subcategories.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </div>
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
              <>
                <ProductListItems
                  items={displayed}
                  onDelete={admin ? setSelected : undefined}
                />
                {totalPages > 1 && (
                  <nav
                    className="catalog-pagination"
                    aria-label="Paginación de productos"
                  >
                    <span className="muted" aria-live="polite">
                      Página {currentPage} de {totalPages}
                    </span>
                    <div>
                      <button
                        className="button"
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        <ChevronLeft size={16} aria-hidden /> Anterior
                      </button>
                      <button
                        className="button"
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        Siguiente <ChevronRight size={16} aria-hidden />
                      </button>
                    </div>
                  </nav>
                )}
              </>
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

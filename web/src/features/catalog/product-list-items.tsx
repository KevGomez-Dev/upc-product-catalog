import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import type { Product } from '../../lib/contracts';
import { UtcTime } from './catalog-ui';

type ItemsProps = { items: Product[]; onDelete?: (product: Product) => void };

function ProductLink({ product }: { product: Product }) {
  return (
    <Link className="product-link" href={`/products/${product.id}`}>
      {product.upcDescription}
    </Link>
  );
}

function ProductActions({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (product: Product) => void;
}) {
  return (
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
        onClick={() => onDelete(product)}
      >
        <Trash2 size={17} aria-hidden />
      </button>
    </div>
  );
}

export function ProductListItems({ items, onDelete }: ItemsProps) {
  return (
    <>
      <div
        className="table-region desktop-products"
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
              {onDelete && <th scope="col">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <tr key={product.id}>
                <th scope="row">
                  <ProductLink product={product} />
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
                {onDelete && (
                  <td>
                    <ProductActions product={product} onDelete={onDelete} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mobile-products" aria-label="Productos">
        {items.map((product) => (
          <li key={product.id} className="mobile-product">
            <header>
              <ProductLink product={product} />
              {onDelete && (
                <ProductActions product={product} onDelete={onDelete} />
              )}
            </header>
            <dl>
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
              <div>
                <dt>Fecha de alta</dt>
                <dd>
                  <UtcTime value={product.dateAdded} />
                </dd>
              </div>
              <div>
                <dt>Última modificación</dt>
                <dd>
                  <UtcTime value={product.updatedDate} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

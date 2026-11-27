'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Save } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LoadError, Loading, Notice } from '../../components/status';
import { request, RequestError } from '../../lib/client';
import type {
  Category,
  ErrorFields,
  Product,
  ProductDetail,
  ProductInput,
  Subcategory,
} from '../../lib/contracts';
import { useResource } from '../../lib/use-resource';
import { useFlash } from '../session/private-shell';
import { BackToProducts, CatalogHeading, MissingProduct } from './catalog-ui';
import { validateProduct } from './product-validation';

const blank: ProductInput = {
  upcCode: '',
  upcDescription: '',
  categoryCode: '',
  subCategoryCode: '',
};
type Field = keyof ProductInput;

export function ProductEditor({ id }: { id?: string }) {
  const { data, loading, error, reload } = useResource<ProductDetail>(
    id ? `/api/catalog/products/${id}` : null,
  );
  if (error?.details.statusCode === 404) return <MissingProduct />;

  return (
    <>
      <BackToProducts />
      <CatalogHeading
        title={id ? 'Editar producto' : 'Nuevo producto'}
        description={
          id
            ? 'Actualiza los datos y la clasificación.'
            : 'Completa los datos para agregar un producto al catálogo.'
        }
      />
      {loading ? (
        <Loading>Cargando producto…</Loading>
      ) : error ? (
        <LoadError message={error.message} retry={reload} />
      ) : (
        <ProductForm key={id ?? 'new'} product={data} />
      )}
    </>
  );
}

function ProductForm({ product }: { product?: ProductDetail }) {
  const [input, setInput] = useState<ProductInput>(() =>
    product
      ? {
          upcCode: product.upcCode,
          upcDescription: product.upcDescription,
          categoryCode: product.categoryCode,
          subCategoryCode: product.subCategoryCode,
        }
      : blank,
  );
  const [errors, setErrors] = useState<ErrorFields>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const router = useRouter();
  const flash = useFlash();
  const categories = useResource<Category[]>('/api/catalog/categories');
  const subcategories = useResource<Subcategory[]>(
    input.categoryCode
      ? `/api/catalog/categories/${encodeURIComponent(input.categoryCode)}/subcategories`
      : null,
  );

  useEffect(() => {
    if (message) feedback.current?.focus();
  }, [message]);

  function change(field: Field, value: string) {
    if (field === 'categoryCode') {
      setInput((previous) => ({
        ...previous,
        categoryCode: value,
        subCategoryCode: '',
      }));
      setErrors((previous) => ({
        ...previous,
        categoryCode: [],
        subCategoryCode: [],
      }));
      subcategories.reload();
    } else {
      setInput((previous) => ({ ...previous, [field]: value }));
      setErrors((previous) => ({ ...previous, [field]: [] }));
    }
  }

  function showErrors(fields: ErrorFields) {
    setErrors(fields);
    const first = Object.keys(blank).find((field) => fields[field]?.length);
    if (first)
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  function fieldProps(field: Field) {
    return {
      id: field,
      name: field,
      required: true,
      'aria-invalid': !!errors[field]?.length,
      'aria-describedby': errors[field]?.length ? `${field}-error` : undefined,
    };
  }

  function fieldError(field: Field) {
    return (
      !!errors[field]?.length && (
        <p id={`${field}-error`} className="field-error">
          {errors[field][0]}
        </p>
      )
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      lock.current ||
      categories.loading ||
      categories.error ||
      subcategories.loading ||
      subcategories.error
    )
      return;
    setMessage('');
    const validation = validateProduct(input, subcategories.data ?? []);
    showErrors(validation);
    if (Object.keys(validation).length) return;

    lock.current = true;
    setBusy(true);
    try {
      const { data: products } = await request<Product[]>(
        '/api/catalog/products',
      );
      if (
        products.some(
          ({ upcCode, id }) => upcCode === input.upcCode && id !== product?.id,
        )
      ) {
        showErrors({ upcCode: ['El UPC ya existe en el catálogo.'] });
        lock.current = false;
        setBusy(false);
        return;
      }
      const { warning } = await request<ProductDetail>(
        product
          ? `/api/catalog/products/${product.id}`
          : '/api/catalog/products',
        { method: product ? 'PUT' : 'POST', body: JSON.stringify(input) },
      );
      flash({
        message: product ? 'Producto actualizado.' : 'Producto creado.',
        warning,
      });
      router.push('/products');
    } catch (failure) {
      if (failure instanceof RequestError) {
        const fields = failure.details.fieldErrors;
        if (fields && Object.keys(blank).some((key) => fields[key]?.length))
          showErrors(fields);
        else setMessage(failure.message);
      } else {
        setMessage('No se pudo guardar el producto. Intenta de nuevo.');
      }
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <form
      ref={form}
      className="panel product-form"
      noValidate
      onSubmit={submit}
    >
      {message && (
        <div ref={feedback} tabIndex={-1}>
          <Notice>{message}</Notice>
        </div>
      )}
      <div className="form-field">
        <label htmlFor="upcCode">UPC</label>
        <input
          {...fieldProps('upcCode')}
          className="upc"
          type="text"
          inputMode="numeric"
          value={input.upcCode}
          onChange={(event) => change('upcCode', event.target.value)}
          placeholder="12 dígitos"
        />
        {fieldError('upcCode')}
      </div>
      <div className="form-field">
        <label htmlFor="upcDescription">Descripción</label>
        <textarea
          {...fieldProps('upcDescription')}
          rows={3}
          value={input.upcDescription}
          onChange={(event) => change('upcDescription', event.target.value)}
        />
        {fieldError('upcDescription')}
      </div>
      <div className="classification-fields">
        <div className="form-field">
          <label htmlFor="categoryCode">Categoría</label>
          <select
            {...fieldProps('categoryCode')}
            value={input.categoryCode}
            disabled={categories.loading || !!categories.error}
            onChange={(event) => change('categoryCode', event.target.value)}
          >
            <option value="">
              {categories.loading
                ? 'Cargando categorías…'
                : 'Selecciona una categoría'}
            </option>
            {categories.data?.map(({ code }) => (
              <option key={code}>{code}</option>
            ))}
          </select>
          {fieldError('categoryCode')}
          {categories.error && (
            <LoadError
              message={categories.error.message}
              retry={categories.reload}
            />
          )}
        </div>
        <div className="form-field">
          <label htmlFor="subCategoryCode">Subcategoría</label>
          <select
            {...fieldProps('subCategoryCode')}
            value={input.subCategoryCode}
            disabled={
              !input.categoryCode ||
              subcategories.loading ||
              !!subcategories.error
            }
            onChange={(event) => change('subCategoryCode', event.target.value)}
          >
            <option value="">
              {subcategories.loading
                ? 'Cargando subcategorías…'
                : 'Selecciona una subcategoría'}
            </option>
            {subcategories.data?.map(({ code }) => (
              <option key={code}>{code}</option>
            ))}
          </select>
          {fieldError('subCategoryCode')}
          {subcategories.error && (
            <LoadError
              message={subcategories.error.message}
              retry={subcategories.reload}
            />
          )}
        </div>
      </div>
      <div className="form-actions">
        <Link
          href={product ? `/products/${product.id}` : '/products'}
          className="button"
        >
          Cancelar
        </Link>
        <button
          className="button button-primary"
          type="submit"
          disabled={
            busy ||
            categories.loading ||
            !!categories.error ||
            subcategories.loading ||
            !!subcategories.error
          }
        >
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Save size={16} aria-hidden />
          )}
          {busy ? 'Guardando…' : 'Guardar producto'}
        </button>
      </div>
    </form>
  );
}

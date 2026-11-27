import { ProductEditor } from '../../../../features/catalog/product-form';
import { requireAdmin } from '../../../../lib/session';

export default async function NewProductPage() {
  await requireAdmin();
  return <ProductEditor />;
}

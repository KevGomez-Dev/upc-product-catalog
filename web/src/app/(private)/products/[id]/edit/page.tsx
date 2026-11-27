import { MissingProduct } from '../../../../../features/catalog/catalog-ui';
import { ProductEditor } from '../../../../../features/catalog/product-form';
import { isProductId } from '../../../../../lib/contracts';
import { requireAdmin } from '../../../../../lib/session';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  return isProductId(id) ? <ProductEditor id={id} /> : <MissingProduct />;
}

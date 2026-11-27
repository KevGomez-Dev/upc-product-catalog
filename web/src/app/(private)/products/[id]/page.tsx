import { MissingProduct } from '../../../../features/catalog/catalog-ui';
import { ProductDetail } from '../../../../features/catalog/product-detail';
import { isProductId } from '../../../../lib/contracts';
import { requireProfile } from '../../../../lib/session';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [profile, { id }] = await Promise.all([requireProfile(), params]);
  return isProductId(id) ? (
    <ProductDetail id={id} admin={profile.role === 'admin'} />
  ) : (
    <MissingProduct />
  );
}

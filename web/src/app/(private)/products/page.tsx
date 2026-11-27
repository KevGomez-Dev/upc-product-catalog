import { ProductList } from '../../../features/catalog/product-list';
import { requireProfile } from '../../../lib/session';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ forbidden?: string }>;
}) {
  const [profile, query] = await Promise.all([requireProfile(), searchParams]);
  return (
    <ProductList
      admin={profile.role === 'admin'}
      forbidden={query.forbidden === '1'}
    />
  );
}

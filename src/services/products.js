import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';

export const CATEGORY_LABELS = {
  shirts: 'Shirts',
  tshirts: 'T-shirts',
  'pants-jeans': 'Pants & denim',
  'ethnic-wear': 'Ethnic wear',
  'jackets-hoodies': 'Layers',
};

function toTimestampValue(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return 0;
}

export function normalizeProduct(product) {
  const price = Number(product.price) || 0;
  const salePrice = Number(product.salePrice);
  const compareAtPrice = Number(product.compareAtPrice);
  const hasSalePrice = Number.isFinite(salePrice) && salePrice > 0 && salePrice < price;

  return {
    ...product,
    price,
    salePrice: hasSalePrice ? salePrice : null,
    compareAtPrice: Number.isFinite(compareAtPrice) && compareAtPrice > price ? compareAtPrice : null,
    currentPrice: hasSalePrice ? salePrice : price,
    featured: product.featured === true,
    badge: typeof product.badge === 'string' ? product.badge : '',
    tags: Array.isArray(product.tags) ? product.tags.filter((tag) => typeof tag === 'string') : [],
    stock: Number.isFinite(Number(product.stock)) ? Math.max(0, Number(product.stock)) : null,
    createdAtValue: toTimestampValue(product.createdAt),
  };
}

export async function fetchProducts() {
  const snapshot = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((product) => normalizeProduct({ id: product.id, ...product.data() }));
}

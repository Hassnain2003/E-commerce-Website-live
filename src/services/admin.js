import { collection, getDocs, query, orderBy, updateDoc, doc, serverTimestamp, addDoc, deleteDoc, where, documentId } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchAdminOrders() {
  const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((order) => ({ id: order.id, ...order.data() }));
}

export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, 'orders', orderId), { status });
}

/**
 * Products are read-only on the storefront client, so admin write access is
 * enforced exclusively on the server (Firestore rules) — never trusted from
 * the browser. All admin product mutations go through these trusted helpers.
 */
export async function fetchAdminProducts() {
  const snapshot = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((product) => ({ id: product.id, ...product.data() }));
}

export async function createProduct(data) {
  const collectionRef = collection(db, 'products');
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateProduct(productId, updates) {
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, updates);
}

export async function deleteProduct(productId) {
  await deleteDoc(doc(db, 'products', productId));
}

/**
 * Compute common admin statistics from a list of orders.
 * Callers providing the same order list avoid extra round-trips.
 */
export function computeOrderStats(orders) {
  const totalOrders = orders.length;
  const processing = orders.filter((o) => o.status === 'processing').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const shipped = orders.filter((o) => o.status === 'shipped').length;
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  return { totalOrders, processing, shipped, delivered, cancelled, revenue };
}

export function filterOrders(orders, { search = '', status = 'all' } = {}) {
  return orders.filter((order) => {
    const emailMatch = !search || (order.shippingInfo?.email || '').toLowerCase().includes(search.toLowerCase()) || (order.shippingInfo?.name || '').toLowerCase().includes(search.toLowerCase());
    const statusMatch = status === 'all' || order.status === status;
    return emailMatch && statusMatch;
  });
}

export function computeProductStats(products) {
  const productCount = products.length;
  const lowStock = products.filter((p) => p.stock != null && p.stock > 0 && p.stock <= 5).length;
  const soldOut = products.filter((p) => p.stock === 0).length;
  const featured = products.filter((p) => p.featured === true).length;
  const onSale = products.filter((p) => p.salePrice != null && p.salePrice > 0).length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock != null ? p.stock : 0), 0);
  return { productCount, lowStock, soldOut, featured, onSale, totalStock };
}

export function filterProducts(products, { search = '' } = {}) {
  const q = search.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) =>
    `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase().includes(q),
  );
}

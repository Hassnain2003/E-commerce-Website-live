import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
  addDoc,
  deleteDoc,
  where,
  documentId,
  onSnapshot,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { fetchProductsByIds } from './products';

export async function fetchAdminOrders() {
  const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((order) => ({ id: order.id, ...order.data() }));
}

export async function fetchAdminOrder(orderId) {
  const orderDoc = await getDoc(doc(db, 'orders', orderId));
  if (!orderDoc.exists()) return null;
  return { id: orderDoc.id, ...orderDoc.data() };
}

export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
}

export async function updateOrderTracking(orderId, trackingNumber) {
  await updateDoc(doc(db, 'orders', orderId), { trackingNumber, updatedAt: serverTimestamp() });
}

export async function updateOrderPayment(orderId, paymentMethod) {
  await updateDoc(doc(db, 'orders', orderId), { paymentMethod, updatedAt: serverTimestamp() });
}

export async function deleteOrder(orderId) {
  await deleteDoc(doc(db, 'orders', orderId));
}

export async function bulkDeleteOrders(orderIds) {
  const batch = writeBatch(db);
  orderIds.forEach((id) => batch.delete(doc(db, 'orders', id)));
  await batch.commit();
}

/**
 * Products — server-trusted CRUS (Create, Read, Update, Delete)
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
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateProduct(productId, updates) {
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteProduct(productId) {
  await deleteDoc(doc(db, 'products', productId));
}

/**
 * Users / Customers
 */
export async function fetchAdminUsers() {
  const snapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((user) => ({ id: user.id, ...user.data() }));
}

export async function updateUserRole(userId, role) {
  if (!['user', 'admin'].includes(role)) throw new Error('Invalid role.');
  await updateDoc(doc(db, 'users', userId), { role, updatedAt: serverTimestamp() });
}

export async function deleteUser(userId) {
  await deleteDoc(doc(db, 'users', userId));
}

/**
 * Statistics
 */
export function computeOrderStats(orders) {
  const totalOrders = orders.length;
  const processing = orders.filter((o) => o.status === 'processing').length;
  const confirmed = orders.filter((o) => o.status === 'confirmed').length;
  const shipped = orders.filter((o) => o.status === 'shipped').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingRevenue = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'delivered')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  return {
    totalOrders,
    processing,
    confirmed,
    shipped,
    delivered,
    cancelled,
    revenue,
    pendingRevenue,
    conversionRate: totalOrders > 0 ? Math.round(((delivered / totalOrders) * 100) * 10) / 10 : 0,
  };
}

export function computeProductStats(products) {
  const productCount = products.length;
  const lowStock = products.filter((p) => p.stock != null && p.stock > 0 && p.stock <= 5).length;
  const soldOut = products.filter((p) => p.stock === 0).length;
  const featured = products.filter((p) => p.featured === true).length;
  const onSale = products.filter((p) => p.salePrice != null && p.salePrice > 0).length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock != null ? p.stock : 0), 0);
  const outOfStockValue = products
    .filter((p) => p.stock === 0)
    .reduce((sum, p) => sum + Number(p.price || 0), 0);
  return { productCount, lowStock, soldOut, featured, onSale, totalStock, outOfStockValue };
}

export function filterOrders(orders, { search = '', status = 'all', sort = 'newest' } = {}) {
  let result = orders.filter((order) => {
    const emailMatch = !search || (order.shippingInfo?.email || '').toLowerCase().includes(search.toLowerCase()) || (order.shippingInfo?.name || '').toLowerCase().includes(search.toLowerCase()) || order.id.toLowerCase().includes(search.toLowerCase());
    const statusMatch = status === 'all' || order.status === status;
    return emailMatch && statusMatch;
  });
  result.sort((a, b) => {
    const aTime = a.createdAt?.seconds ?? a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.seconds ?? b.createdAt?.toMillis?.() ?? 0;
    return sort === 'newest' ? bTime - aTime : aTime - bTime;
  });
  return result;
}

export function filterProducts(products, { search = '', category = 'all', stock = 'all' } = {}) {
  let result = products.filter((p) => {
    const q = search.trim().toLowerCase();
    const searchMatch = !q || `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase().includes(q);
    const categoryMatch = category === 'all' || p.category === category;
    let stockMatch = true;
    if (stock === 'in-stock') stockMatch = (p.stock ?? 0) > 0;
    if (stock === 'low-stock') stockMatch = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5;
    if (stock === 'out-of-stock') stockMatch = (p.stock ?? 0) === 0;
    return searchMatch && categoryMatch && stockMatch;
  });
  return result;
}

/**
 * Real-time subscriptions
 */
export function subscribeToOrders(onNext, onError) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((order) => ({ id: order.id, ...order.data() }));
    onNext(orders);
  }, onError);
}

export function subscribeToProducts(onNext, onError) {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map((product) => ({ id: product.id, ...product.data() }));
    onNext(products);
  }, onError);
}

export function subscribeToUsers(onNext, onError) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map((user) => ({ id: user.id, ...user.data() }));
    onNext(users);
  }, onError);
}

/**
 * Bulk operations
 */
export async function bulkUpdateOrderStatus(orderIds, status) {
  const batch = writeBatch(db);
  orderIds.forEach((id) => {
    batch.update(doc(db, 'orders', id), { status, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

export async function bulkUpdateProductStock(updates) {
  // updates: Array of { productId, stock }
  const batch = writeBatch(db);
  updates.forEach(({ productId, stock }) => {
    batch.update(doc(db, 'products', productId), { stock, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

/**
 * Format currency
 */
export function formatPKR(value) {
  return `PKR ${Number(value || 0).toLocaleString()}`;
}

export function orderDateValue(order) {
  if (!order?.createdAt) return null;
  if (typeof order.createdAt.toDate === 'function') return order.createdAt.toDate();
  if (typeof order.createdAt === 'number') return new Date(order.createdAt);
  if (order.createdAt instanceof Date) return order.createdAt;
  if (order.createdAt?.seconds) return new Date(order.createdAt.seconds * 1000);
  return null;
}

export function formatOrderDate(order) {
  const date = orderDateValue(order);
  return date ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export function formatOrderDateTime(order) {
  const date = orderDateValue(order);
  return date ? date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

export function estimatedDeliveryDays(status) {
  switch (status) {
    case 'processing': return 7;
    case 'confirmed': return 5;
    case 'shipped': return 3;
    default: return 0;
  }
}

import { collection, doc, getDocs, query, serverTimestamp, setDoc, where, documentId } from 'firebase/firestore';
import { db } from './firebase';
import { fetchProductsByIds } from './products';

/** Flat delivery fee in PKR. */
export const SHIPPING_FEE = 5;
/** Subtotal threshold (PKR) above which delivery is free. */
export const FREE_DELIVERY_THRESHOLD = 20000;

/** Delivery fee for a given subtotal: free above the threshold. */
export function shippingFor(subtotal) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;
}

/**
 * Place an order with server-side price and stock verification.
 *
 * Product prices are read from Firestore here — never trusted from the browser cart.
 * Totals are recalculated on the server and each item is checked for existence
 * and stock before the order document is written.
 */
export async function createOrder({ userId, items, shippingInfo, paymentMethod }) {
  if (!userId) throw new Error('A signed-in user is required to place an order.');
  if (!items.length) throw new Error('Your cart is empty.');
  if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.phone || !shippingInfo.address) {
    throw new Error('Complete all delivery details before placing your order.');
  }
  if (paymentMethod !== 'cod') throw new Error('Card payment is not available yet. Choose cash on delivery.');

  // Read authoritative product data from Firestore (server-side price verification).
  const products = await fetchProductsByIds(items.map((item) => item.id));
  const productById = new Map(products.map((product) => [product.id, product]));

  const normalizedItems = [];
  for (const item of items) {
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const product = productById.get(item.id);

    if (!product) {
      throw new Error(`"${item.name}" is no longer available and was removed from your bag.`);
    }
    if (product.stock === 0) {
      throw new Error(`"${product.name}" is sold out. Please remove it from your bag.`);
    }
    if (product.stock != null && product.stock < quantity) {
      throw new Error(`"${product.name}" only has ${product.stock} left in stock.`);
    }

    // Authoritative price from Firestore — browser-submitted prices are never trusted.
    const price = Number(product.currentPrice || product.price) || 0;
    if (!item.id || !item.name || !Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error('One of the items in your cart is invalid. Remove it and add it again.');
    }

    normalizedItems.push({
      id: item.id,
      name: product.name,
      price,
      quantity,
      imageUrl: product.imageUrl || item.imageUrl || '',
    });
  }

  const subtotal = normalizedItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = shippingFor(subtotal);
  const orderRef = doc(collection(db, 'orders'));

  await setDoc(orderRef, {
    userId,
    items: normalizedItems,
    shippingInfo,
    paymentMethod,
    subtotal,
    shipping,
    total: subtotal + shipping,
    status: 'processing',
    createdAt: serverTimestamp(),
  });

  return orderRef.id;
}

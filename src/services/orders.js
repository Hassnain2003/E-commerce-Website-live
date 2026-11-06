import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function createOrder({ userId, items, shippingInfo, paymentMethod }) {
  if (!userId) throw new Error('A signed-in user is required to place an order.');
  if (!items.length) throw new Error('Your cart is empty.');
  if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.phone || !shippingInfo.address) {
    throw new Error('Complete all delivery details before placing your order.');
  }
  if (paymentMethod !== 'cod') throw new Error('Card payment is not available yet. Choose cash on delivery.');

  const normalizedItems = items.map((item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    if (!item.id || !item.name || !Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error('One of the items in your cart is invalid. Remove it and add it again.');
    }
    return {
      id: item.id,
      name: item.name,
      price,
      quantity,
      ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
    };
  });
  const subtotal = normalizedItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = 5;
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

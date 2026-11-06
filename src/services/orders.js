import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function createOrder({ userId, items, shippingInfo, paymentMethod }) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = 5;
  const orderRef = doc(collection(db, 'orders'));

  await setDoc(orderRef, {
    userId,
    items,
    shippingInfo,
    paymentMethod,
    paymentDetails: null,
    subtotal,
    shipping,
    total: subtotal + shipping,
    status: 'processing',
    createdAt: serverTimestamp(),
  });

  return orderRef.id;
}

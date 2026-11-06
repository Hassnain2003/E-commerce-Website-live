import { collection, doc, doc as docRef, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchOrdersForUser(userId) {
  const snapshot = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId)));
  return snapshot.docs
    .map((order) => ({ id: order.id, ...order.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function fetchOrderById(orderId) {
  const orderDoc = await getDoc(docRef(db, 'orders', orderId));
  if (!orderDoc.exists()) return null;
  return { id: orderDoc.id, ...orderDoc.data() };
}

/**
 * Subscribe to a user's orders in real time. Admin status changes are pushed
 * to the customer automatically via Firestore onSnapshot.
 * Returns an unsubscribe function.
 */
export function subscribeToOrders(userId, onNext, onError) {
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs
        .map((order) => ({ id: order.id, ...order.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      onNext(orders);
    },
    onError,
  );
}

/**
 * Subscribe to a single order in real time.
 * Returns an unsubscribe function. Calls onNext(null) when the order does not exist.
 */
export function subscribeToOrder(orderId, onNext, onError) {
  return onSnapshot(
    docRef(db, 'orders', orderId),
    (orderDoc) => {
      if (!orderDoc.exists()) {
        onNext(null);
        return;
      }
      onNext({ id: orderDoc.id, ...orderDoc.data() });
    },
    onError,
  );
}

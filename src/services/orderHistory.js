import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchOrdersForUser(userId) {
  const snapshot = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId)));
  return snapshot.docs
    .map((order) => ({ id: order.id, ...order.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchAdminOrders() {
  const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((order) => ({ id: order.id, ...order.data() }));
}

export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, 'orders', orderId), { status });
}

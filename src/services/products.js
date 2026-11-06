import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchProducts() {
  const snapshot = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((product) => ({ id: product.id, ...product.data() }));
}

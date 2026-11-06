import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function updateUserProfile(userId, details) {
  await updateDoc(doc(db, 'users', userId), {
    name: details.name.trim(),
    phone: details.phone.trim(),
    address: details.address.trim(),
  });
}

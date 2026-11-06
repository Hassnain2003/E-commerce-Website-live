import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Build a Firebase Storage path for a product image.
 * Kept category-scoped so images stay organized as the catalog grows.
 */
export function productImagePath({ category, productId, fileName }) {
  return `products/${category}/${productId}/${fileName}`;
}

/**
 * Upload a product image to Firebase Storage and return its public download URL.
 * Callers store the returned URL in Firestore (imageUrl / gallery / thumbnailUrl).
 * Intended for trusted admin flows (Phase 16); not exposed to anonymous users.
 */
export async function uploadProductImage(file, { category, productId, fileName }) {
  const storageRef = ref(storage, productImagePath({ category, productId, fileName }));
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

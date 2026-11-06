import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function registerAccount({ name, email, password, phone, address }) {
  const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await setDoc(doc(db, 'users', credentials.user.uid), {
    uid: credentials.user.uid,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    address: address.trim(),
    role: 'user',
    createdAt: serverTimestamp(),
  });
  return credentials.user;
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

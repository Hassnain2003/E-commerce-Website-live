import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setUser(nextUser);
    if (!nextUser) {
      setProfile(null);
      setStatus('ready');
      return;
    }

    try {
      const profileSnapshot = await getDoc(doc(db, 'users', nextUser.uid));
      setProfile(profileSnapshot.exists() ? profileSnapshot.data() : null);
      setStatus('ready');
    } catch (error) {
      console.error('Unable to load account profile:', error);
      setProfile(null);
      setStatus('error');
    }
  }), []);

  async function signOutUser() {
    await firebaseSignOut(auth);
  }

  const value = useMemo(() => ({
    user,
    profile,
    isAdmin: profile?.role === 'admin',
    isLoading: status === 'loading',
    hasProfileError: status === 'error',
    signOut: signOutUser,
  }), [profile, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

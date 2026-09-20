'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { User } from '@/lib/types';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  dbUser: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const serializeUserDoc = (docSnap: any): User => {
  const data = docSnap.data();
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return { id: docSnap.id, ...data } as User;
};

const fetchUserFromFirestore = async (uid: string, email?: string | null): Promise<User | null> => {
  const usersCollection = collection(db, 'Users');

  const q1 = query(usersCollection, where("userid", "==", uid));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) return serializeUserDoc(snap1.docs[0]);

  const docRef = doc(db, 'Users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return serializeUserDoc(docSnap);

  if (email) {
    const q2 = query(usersCollection, where("email", "==", email));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) return serializeUserDoc(snap2.docs[0]);
  }

  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.uid) {
        try {
            const dbUserData = await fetchUserFromFirestore(user.uid, user.email);
            setDbUser(dbUserData);
        } catch (e) {
            console.error("Failed to load user data:", e);
            setDbUser(null);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const value = { currentUser, dbUser, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

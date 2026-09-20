
'use server';
import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
  serverTimestamp,
  query,
  where,
  setDoc,
} from 'firebase/firestore';

const usersCollection = collection(db, 'Users');

export type User = {
  id?: string;
  userid: string;
  name: string;
  phoneNumber: string;
  email: string;
  type: 'customer' | 'vendor';
  createdAt?: string; // ISO string format
  profileImageUrl?: string;
  city?: string;
  status?: 'Active' | 'Inactive';
  processingServices?: number;
  completedServices?: number;
};

// Helper function to safely serialize Firestore data
const serializeDoc = (doc: any) => {
  const data = doc.data();
  if (!data) return null;
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return { id: doc.id, ...data };
}

export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => serializeDoc(doc) as User).filter(Boolean);
};

export const getVendorsFromUsers = async (): Promise<User[]> => {
    const q = query(usersCollection, where("type", "==", "vendor"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = serializeDoc(doc) as User;
      // Provide default values if they don't exist
      data.processingServices = data.processingServices ?? 0;
      data.completedServices = data.completedServices ?? 0;
      data.status = data.status ?? 'Active';
      return data;
    }).filter(Boolean);
}

export const getUserById = async (id: string): Promise<User | null> => {
    const q = query(usersCollection, where("userid", "==", id));
    const snapshot = await getDocs(q);
    if(!snapshot.empty) {
        return serializeDoc(snapshot.docs[0]) as User;
    }
    return null;
}


export const createUser = async (uid: string, name: string, email: string, userType: 'customer' | 'vendor' = 'customer', city: string = '', phoneNumber: string = '') => {
  const newUser: Omit<User, 'id'> = {
    userid: uid,
    name,
    email,
    phoneNumber: phoneNumber,
    type: userType,
    createdAt: new Date().toISOString(),
    profileImageUrl: '',
    city: city,
    status: 'Active',
    processingServices: 0,
    completedServices: 0,
  };

  // Use the Firebase Auth UID as the document ID in Firestore for easy lookup
  const userDocRef = doc(db, 'Users', uid);
  await setDoc(userDocRef, newUser);

  return { id: uid, ...newUser };
};


export const updateUser = async (id: string, user: Partial<Omit<User, 'id' | 'userid'>>) => {
  const userDoc = doc(db, 'Users', id);
  const updateData: Record<string, any> = { ...user };
  await updateDoc(userDoc, updateData);
  return { id };
};

export const deleteUser = async (id: string) => {
  const userDoc = doc(db, 'Users', id);
  await deleteDoc(userDoc);
  return { id };
};

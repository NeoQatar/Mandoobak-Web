
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
import { v4 as uuidv4 } from 'uuid';
export type { User } from './types';
import type { User } from './types';

const usersCollection = collection(db, 'Users');

// Helper function to safely serialize Firestore data
const serializeDoc = (doc: any) => {
  const data = doc.data();
  if (!data) return null;
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }

  // Handle various phone number field names
  const phoneNumber = data.phoneNumber || 
                      data.phone || 
                      data.mobile || 
                      data.phonenumber || 
                      data.mobileNumber || 
                      '';
  
  return { 
    id: doc.id, 
    ...data,
    phoneNumber: phoneNumber,
    phone: phoneNumber // Provide 'phone' for compatibility with existing UI code
  };
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
    const docRef = doc(db, 'Users', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return serializeDoc(docSnap) as User;
    }
    return null;
}


export const createUser = async (uidOrData: string | any, name?: string, email?: string, userType: 'customer' | 'vendor' = 'customer', city: string = '', phoneNumber: string = '') => {
  let newUser: Omit<User, 'id'>;
  let docId: string;

  if (typeof uidOrData === 'object') {
    // Handle object argument (as used in the UI)
    const data = uidOrData;
    docId = data.userid || data.uid || uuidv4(); // Need uuidv4 if no ID
    newUser = {
      userid: docId,
      name: data.name || '',
      email: data.email || '',
      phoneNumber: data.phoneNumber || data.phone || data.phoneNumber || '',
      type: data.type || 'customer',
      createdAt: new Date().toISOString(),
      profileImageUrl: data.profileImageUrl || '',
      city: data.city || '',
      status: 'Active',
      processingServices: 0,
      completedServices: 0,
    };
  } else {
    // Handle positional arguments
    docId = uidOrData;
    newUser = {
      userid: docId,
      name: name || '',
      email: email || '',
      phoneNumber: phoneNumber,
      type: userType,
      createdAt: new Date().toISOString(),
      profileImageUrl: '',
      city: city,
      status: 'Active',
      processingServices: 0,
      completedServices: 0,
    };
  }

  const userDocRef = doc(db, 'Users', docId);
  await setDoc(userDocRef, newUser);

  return { id: docId, ...newUser };
};


export const updateUser = async (id: string, user: Partial<Omit<User, 'id' | 'userid'>>) => {
  const userDoc = doc(db, 'Users', id);
  const updateData: Record<string, any> = { ...user };
  
  // Map 'phone' to 'phoneNumber' if it exists in update data
  if (updateData.phone && !updateData.phoneNumber) {
    updateData.phoneNumber = updateData.phone;
  }
  
  await updateDoc(userDoc, updateData);
  return { id };
};

export const deleteUser = async (id: string) => {
  const userDoc = doc(db, 'Users', id);
  await deleteDoc(userDoc);
  return { id };
};

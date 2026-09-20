
'use server';
import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';

const vendorsCollection = collection(db, 'vendors');

export type Vendor = {
  id?: string;
  username: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  password?: string;
  processingServices: number;
  completedServices: number;
  status: 'Active' | 'Inactive';
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

export const getVendors = async (): Promise<Vendor[]> => {
  const snapshot = await getDocs(vendorsCollection);
  return snapshot.docs.map(doc => {
      const data = serializeDoc(doc) as Vendor;
      // Provide default values if they don't exist
      data.processingServices = data.processingServices ?? 0;
      data.completedServices = data.completedServices ?? 0;
      return data;
  }).filter(Boolean);
};

export const getVendorById = async (id: string): Promise<Vendor | null> => {
    const vendorDoc = doc(db, 'vendors', id);
    const snapshot = await getDoc(vendorDoc);
    if(snapshot.exists()) {
        return serializeDoc(snapshot) as Vendor;
    }
    return null;
}

export const createVendor = async (vendor: Omit<Vendor, 'id'>) => {
  const newVendorData = {
    ...vendor,
    processingServices: 0,
    completedServices: 0,
  }
  const docRef = await addDoc(vendorsCollection, newVendorData);
  return { id: docRef.id };
};

export const updateVendor = async (id: string, vendor: Partial<Omit<Vendor, 'id'>>) => {
  const vendorDoc = doc(db, 'vendors', id);
  // Do not update password if it's not provided or empty
  if (vendor.password === '' || vendor.password === undefined) {
    delete vendor.password;
  }
  await updateDoc(vendorDoc, vendor);
  return { id };
};

export const deleteVendor = async (id: string) => {
  const vendorDoc = doc(db, 'vendors', id);
  await deleteDoc(vendorDoc);
  return { id };
};

    


import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  limit
} from 'firebase/firestore';

const bannerCollection = collection(db, 'banner');

export type Banner = {
  id?: string;
  imageUrl: string;
  status: 'Active' | 'Inactive';
};

export const getBanner = async (): Promise<Banner | null> => {
  const q = query(bannerCollection, limit(1));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docData = snapshot.docs[0].data();
    return { id: snapshot.docs[0].id, ...docData } as Banner;
  }
  return null;
};

export const createBanner = async (banner: Omit<Banner, 'id'>) => {
  const docRef = await addDoc(bannerCollection, banner);
  return { id: docRef.id };
};

export const updateBanner = async (id: string, banner: Partial<Omit<Banner, 'id'>>) => {
  const bannerDocRef = doc(db, 'banner', id);
  await updateDoc(bannerDocRef, banner);
};

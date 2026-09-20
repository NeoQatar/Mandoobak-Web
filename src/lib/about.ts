'use server';

import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type AboutContent = {
  heading: string;
  description: string;
  imageUrl?: string;
};

const aboutDocRef = doc(db, 'settings', 'about');

export const getAbout = async (): Promise<AboutContent> => {
  const docSnap = await getDoc(aboutDocRef);
  if (docSnap.exists()) {
    return docSnap.data() as AboutContent;
  }
  return { heading: '', description: '', imageUrl: '' };
};

export const updateAbout = async (data: AboutContent): Promise<void> => {
  await setDoc(aboutDocRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

'use server';

import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type ContactUsContent = {
  heading: string;
  description: string;
  imageUrl?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  workingHours?: string;
  whatsapp?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  mapUrl?: string;
};

const contactDocRef = doc(db, 'settings', 'contactus');

export const getContactUs = async (): Promise<ContactUsContent> => {
  const docSnap = await getDoc(contactDocRef);
  if (docSnap.exists()) return docSnap.data() as ContactUsContent;
  return { heading: '', description: '' };
};

export const updateContactUs = async (data: ContactUsContent): Promise<void> => {
  await setDoc(contactDocRef, { ...data, updatedAt: serverTimestamp() });
};

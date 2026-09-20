
'use server';
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type Policy = {
  description: string;
};

const policyDocRef = doc(db, 'settings', 'termsconditions');

export const getTermsAndConditions = async (): Promise<Policy> => {
  const docSnap = await getDoc(policyDocRef);
  if (docSnap.exists()) {
    return docSnap.data() as Policy;
  }
  // Return a default empty state if it doesn't exist
  return { description: '' };
};

export const updateTermsAndConditions = async (content: string): Promise<void> => {
  await setDoc(policyDocRef, {
    description: content,
    updatedAt: serverTimestamp(),
  });
};

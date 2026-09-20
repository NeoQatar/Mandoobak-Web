
'use server';
import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export type FAQ = {
  id: number; // Keeping ID for local key mapping
  question: string;
  answer: string;
};

// The data is stored in a single document, within an array field.
type FaqsDocument = {
  faqs: FAQ[];
};

const faqDocRef = doc(db, 'settings', 'faqs');

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
};

export const getFaqs = async (): Promise<FAQ[]> => {
  const docSnap = await getDoc(faqDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data() as FaqsDocument;
    // Ensure consistent ordering if not already sorted, and add a temporary id for client-side keys
    return (data.faqs || []).map((faq, index) => ({...faq, id: faq.id || Date.now() + index}));
  }
  return [];
};

export const updateFaqs = async (faqs: FAQ[]): Promise<void> => {
  // Remove temporary client-side IDs before saving
  const faqsToSave = faqs.map(({ ...faq }) => {
      // The id is only for local state key prop, so we don't save it
      const {id, ...rest} = faq;
      return rest;
  });

  await setDoc(faqDocRef, {
    faqs: faqsToSave,
    updatedAt: serverTimestamp(),
  });
};

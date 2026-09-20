
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  Timestamp,
  serverTimestamp,
  query,
  limit,
} from 'firebase/firestore';

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export interface ServiceDetails {
    id?: string;
    bannerImage: string | null;
    videoUrl: string;
    videoThumbnailUrl: string;
    serviceCategory: string;
    serviceTitle: string;
    showHighlight: boolean;
    description: string;
    highlightTitle: string;
    highlightNote: string;
    highlightText: string;
    highlightIcon: string;
    faqs: FAQItem[];
    price?: number;
    updatedAt: any;
}


const serializeDoc = (doc: any) => {
  const data = doc.data();
  if (!data) return null;
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  });
  return {id: doc.id, ...data};
};


export async function getServiceDetails(serviceId: string): Promise<ServiceDetails | null> {
    const detailsCollection = collection(db, 'services', serviceId, 'details');
    const q = query(detailsCollection, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }
    
    return serializeDoc(snapshot.docs[0]) as ServiceDetails;
}


export async function updateServiceDetails(serviceId: string, details: Partial<Omit<ServiceDetails, 'id'>>): Promise<void> {
    const detailsCollection = collection(db, 'services', serviceId, 'details');
    const q = query(detailsCollection, limit(1));
    const snapshot = await getDocs(q);
    
    let docRef;
    if (snapshot.empty) {
        docRef = doc(detailsCollection); // Create a new doc if none exists
    } else {
        docRef = snapshot.docs[0].ref; // Get ref to the existing doc
    }

    await setDoc(docRef, {
        ...details,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

    
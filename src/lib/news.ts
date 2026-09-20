
import { db, storage } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import * as firebaseStorage from 'firebase/storage';
// @ts-ignore
const { ref, uploadBytes, getDownloadURL, deleteObject } = firebaseStorage;

const newsCollection = collection(db, 'news');

export type News = {
  id?: string;
  title: string;
  description: string;
  date: Timestamp | Date | string;
  imageUrl: string;
  status: 'Active' | 'Inactive';
  sortOrder?: number;
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
  
  // Prioritize finding base64 data in multiple possible field names
  const base64 = data.image64 || 
                 (data.imageUrl?.startsWith('data:image') ? data.imageUrl : null) ||
                 (data.image?.startsWith('data:image') ? data.image : null);
                 
  // Fallback to imageUrl, then image, then empty string
  const imageUrl = base64 || data.imageUrl || data.image || '';
  
  return { 
    id: doc.id, 
    ...data,
    imageUrl: imageUrl,
    image64: base64
  };
}

export const getNews = async (): Promise<News[]> => {
  // Fetch all docs (some may not have sortOrder yet), then sort client-side
  const snapshot = await getDocs(newsCollection);
  const items = snapshot.docs.map(doc => serializeDoc(doc) as News).filter(Boolean);
  return items.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
};

export const getNewsById = async (id: string): Promise<News | null> => {
    const newsDoc = doc(db, 'news', id);
    const snapshot = await getDoc(newsDoc);
    if(snapshot.exists()) {
        return serializeDoc(snapshot) as News;
    }
    return null;
}

export const createNews = async (news: Omit<News, 'id' | 'imageUrl'>, imageFile: File | null, sortOrder?: number) => {
  if (!imageFile) {
    throw new Error('Image is required for creating a news article.');
  }

  // Ensure date is a Firestore Timestamp
  let date = news.date;
  if (date instanceof Date) {
    date = Timestamp.fromDate(date);
  } else if (typeof date === 'string') {
    date = Timestamp.fromDate(new Date(date));
  }

  // 1. Create document with placeholder image to get ID
  const docData = { ...news, imageUrl: '', date, sortOrder: sortOrder ?? 0 };
  const docRef = await addDoc(newsCollection, docData);
  const docId = docRef.id;

  // 2. Upload image to news/{docId}/{filename}
  const storageRef = ref(storage, `news/${docId}/${imageFile.name}`);
  const snapshot = await uploadBytes(storageRef, imageFile);
  const imageUrl = await getDownloadURL(snapshot.ref);

  // 3. Update document with real image URL
  await updateDoc(docRef, { imageUrl });
  
  return { id: docRef.id };
};

export const updateNews = async (id: string, news: Partial<Omit<News, 'id'>>, imageFile?: File | null) => {
  const newsDocRef = doc(db, 'news', id);
  const newsDoc = await getDoc(newsDocRef);

  if (!newsDoc.exists()) {
    throw new Error("News article not found");
  }

  const updateData: any = { ...news };
  
  if (updateData.date) {
    if (updateData.date instanceof Date) {
        updateData.date = Timestamp.fromDate(updateData.date);
    } else if (typeof updateData.date === 'string') {
        updateData.date = Timestamp.fromDate(new Date(updateData.date));
    }
  }

  if (imageFile) {
    // Upload new image to news/{docId}/{filename}
    const storageRef = ref(storage, `news/${id}/${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(snapshot.ref);
    updateData.imageUrl = imageUrl;

    // Delete old image if it exists and is a storage URL
    const oldImageUrl = newsDoc.data()?.imageUrl;
    if (oldImageUrl && oldImageUrl.includes('firebasestorage')) {
        try {
            const oldImageRef = ref(storage, oldImageUrl);
            await deleteObject(oldImageRef);
        } catch (e) {
            console.error("Failed to delete old image:", e);
        }
    }
  }
  
  await updateDoc(newsDocRef, updateData);
};


export const deleteNews = async (id: string, imageUrl?: string) => {
    // Delete image folder/file from storage if applicable
    if (imageUrl && imageUrl.includes('firebasestorage')) {
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (e) {
            console.error("Failed to delete image from storage:", e);
        }
    }

    const newsDocRef = doc(db, 'news', id);
    await deleteDoc(newsDocRef);
};

export const updateNewsOrder = async (items: { id: string; sortOrder: number }[]) => {
  const batch = writeBatch(db);
  items.forEach(({ id, sortOrder }) => {
    const newsRef = doc(db, 'news', id);
    batch.update(newsRef, { sortOrder });
  });
  await batch.commit();
};

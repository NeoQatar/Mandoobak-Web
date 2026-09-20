
'use server';
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
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

const newsCollection = collection(db, 'news');

export type News = {
  id?: string;
  title: string;
  description: string;
  date: Timestamp | Date | string; // Stored as Timestamp, handled as Date/string on client
  imageUrl: string;
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

export const getNews = async (): Promise<News[]> => {
  const snapshot = await getDocs(newsCollection);
  return snapshot.docs.map(doc => serializeDoc(doc) as News).filter(Boolean);
};

export const getNewsById = async (id: string): Promise<News | null> => {
    const newsDoc = doc(db, 'news', id);
    const snapshot = await getDoc(newsDoc);
    if(snapshot.exists()) {
        return serializeDoc(snapshot) as News;
    }
    return null;
}

const uploadNewsImage = async (title: string, imageFile: string) => {
    if (!imageFile.startsWith('data:image')) {
        return imageFile; // It's already a URL
    }
    const storageRef = ref(storage, `news/${title.replace(/\s/g, '_')}-${Date.now()}`);
    await uploadString(storageRef, imageFile, 'data_url');
    return await getDownloadURL(storageRef);
};

export const createNews = async (news: Omit<News, 'id' | 'imageUrl'>, imageFile: string | null) => {
  if (!imageFile) {
    throw new Error('Image is required for creating a news article.');
  }
  const imageUrl = await uploadNewsImage(news.title, imageFile);
  const docData = { ...news, imageUrl, date: news.date };
  const docRef = await addDoc(newsCollection, docData);
  return { id: docRef.id };
};

export const updateNews = async (id: string, news: Partial<Omit<News, 'id'>>, imageFile?: string | null) => {
  const newsDocRef = doc(db, 'news', id);
  const newsDoc = await getDoc(newsDocRef);

  if (!newsDoc.exists()) {
    throw new Error("News article not found");
  }

  const oldData = newsDoc.data();
  const updateData: Partial<News> = { ...news };
  
  if (imageFile) {
    // Delete the old image if it exists and it's a firebase storage url
    if (oldData && oldData.imageUrl && oldData.imageUrl.includes('firebasestorage.googleapis.com')) {
      try {
        const oldImageRef = ref(storage, oldData.imageUrl);
        await deleteObject(oldImageRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.error("Failed to delete old image:", error);
        }
      }
    }

    const newImageUrl = await uploadNewsImage(news.title || oldData.title, imageFile);
    updateData.imageUrl = newImageUrl;
  }
  
  await updateDoc(newsDocRef, updateData);
};


export const deleteNews = async (id: string) => {
    const newsDocRef = doc(db, 'news', id);
    const newsDoc = await getDoc(newsDocRef);
    if (newsDoc.exists()) {
        const data = newsDoc.data();
        if (data.imageUrl && data.imageUrl.includes('firebasestorage.googleapis.com')) {
            try {
                const imageRef = ref(storage, data.imageUrl);
                await deleteObject(imageRef);
            } catch (error: any) {
                if (error.code !== 'storage/object-not-found') {
                    console.error("Error deleting image from storage:", error);
                }
            }
        }
    }
  await deleteDoc(newsDocRef);
};

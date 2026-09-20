
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
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

const categoriesCollection = collection(db, 'categories');

export type Category = {
  id?: string;
  name: string;
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

export const getCategories = async (): Promise<Category[]> => {
  const snapshot = await getDocs(categoriesCollection);
  return snapshot.docs.map(doc => serializeDoc(doc) as Category).filter(Boolean);
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
    const categoryDoc = doc(db, 'categories', id);
    const snapshot = await getDoc(categoryDoc);
    if(snapshot.exists()) {
        return serializeDoc(snapshot) as Category;
    }
    return null;
}

const uploadCategoryImage = async (name: string, imageFile: string) => {
    if (!imageFile.startsWith('data:image')) {
        return imageFile; // It's already a URL
    }
    const storageRef = ref(storage, `categories/${name.replace(/\s/g, '_')}-${Date.now()}`);
    await uploadString(storageRef, imageFile, 'data_url');
    return await getDownloadURL(storageRef);
};

export const createCategory = async (category: Omit<Category, 'id' | 'imageUrl'>, imageFile: string | null) => {
  if (!imageFile) {
    throw new Error('Image is required for creating a category.');
  }
  const imageUrl = await uploadCategoryImage(category.name, imageFile);
  const { name, status } = category;
  const docRef = await addDoc(categoriesCollection, { name, status, imageUrl });
  return { id: docRef.id };
};

export const updateCategory = async (id: string, category: Partial<Omit<Category, 'id'>>, imageFile?: string | null) => {
  const categoryDocRef = doc(db, 'categories', id);
  const categoryDoc = await getDoc(categoryDocRef);

  if (!categoryDoc.exists()) {
    throw new Error("Category not found");
  }

  const oldData = categoryDoc.data();
  const updateData: Partial<Category> = { ...category };
  
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

    const newImageUrl = await uploadCategoryImage(category.name || oldData.name, imageFile);
    updateData.imageUrl = newImageUrl;
  }
  
  await updateDoc(categoryDocRef, updateData);
};


export const deleteCategory = async (id: string) => {
    const categoryDocRef = doc(db, 'categories', id);
    const categoryDoc = await getDoc(categoryDocRef);
    if (categoryDoc.exists()) {
        const data = categoryDoc.data();
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
  await deleteDoc(categoryDocRef);
};

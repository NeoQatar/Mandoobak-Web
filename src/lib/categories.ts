

import { db } from './firebase';
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

const categoriesCollection = collection(db, 'categories');

export type Category = {
  id?: string;
  name: string;
  imageUrl: string;
  status: 'Active' | 'Inactive';
  departmentId?: string;
  departmentName?: string;
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
    return imageFile; // Just return base64
};

export const createCategory = async (category: Omit<Category, 'id' | 'imageUrl'>, imageFile: string | null) => {
  if (!imageFile) {
    throw new Error('Image is required for creating a category.');
  }
  const imageUrl = await uploadCategoryImage(category.name, imageFile);
  const { name, status } = category as any;
  const docData: Record<string, any> = { name, status, imageUrl };
  if ((category as any).departmentId) docData.departmentId = (category as any).departmentId;
  const docRef = await addDoc(categoriesCollection, docData);
  return { id: docRef.id };
};

export const updateCategory = async (id: string, category: Partial<Omit<Category, 'id'>>, imageFile?: string | null) => {
  const categoryDocRef = doc(db, 'categories', id);
  const categoryDoc = await getDoc(categoryDocRef);

  if (!categoryDoc.exists()) {
    throw new Error("Category not found");
  }

  const updateData: any = { ...category };
  
  if (imageFile) {
    const imageUrl = await uploadCategoryImage(category.name || categoryDoc.data().name, imageFile);
    updateData.imageUrl = imageUrl;
  }
  
  await updateDoc(categoryDocRef, updateData);
};


export const deleteCategory = async (id: string) => {
    const categoryDocRef = doc(db, 'categories', id);
  await deleteDoc(categoryDocRef);
};

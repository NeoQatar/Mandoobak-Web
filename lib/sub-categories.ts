
'use server';
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

const subCategoriesCollection = collection(db, 'sub-categories');

export type SubCategory = {
  id?: string;
  name: string;
  categoryId: string;
  categoryName?: string; // For display, not stored in DB
  status: 'Active' | 'Inactive';
};

// Helper function to safely serialize Firestore data
const serializeDoc = (doc: any) => {
  const data = doc.data();
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return { id: doc.id, ...data };
}

export const getSubCategories = async (): Promise<SubCategory[]> => {
  const snapshot = await getDocs(subCategoriesCollection);
  return snapshot.docs.map(doc => serializeDoc(doc) as SubCategory);
};

export const getSubCategoryById = async (id: string): Promise<SubCategory | null> => {
    const subCategoryDoc = doc(db, 'sub-categories', id);
    const snapshot = await getDoc(subCategoryDoc);
    if(snapshot.exists()) {
        return serializeDoc(snapshot) as SubCategory;
    }
    return null;
}

export const createSubCategory = async (subCategory: Omit<SubCategory, 'id'>) => {
  const { name, categoryId, status } = subCategory;
  const docRef = await addDoc(subCategoriesCollection, { name, categoryId, status });
  return { id: docRef.id };
};

export const updateSubCategory = async (id: string, subCategory: Partial<Omit<SubCategory, 'id'>>) => {
  const subCategoryDoc = doc(db, 'sub-categories', id);
  await updateDoc(subCategoryDoc, subCategory);
};

export const deleteSubCategory = async (id: string) => {
  const subCategoryDoc = doc(db, 'sub-categories', id);
  await deleteDoc(subCategoryDoc);
};

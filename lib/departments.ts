
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

const departmentsCollection = collection(db, 'departments');

export type Department = {
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

export const getDepartments = async (): Promise<Department[]> => {
  const snapshot = await getDocs(departmentsCollection);
  return snapshot.docs.map(doc => serializeDoc(doc) as Department).filter(Boolean);
};

export const getDepartmentById = async (id: string): Promise<Department | null> => {
    const departmentDoc = doc(db, 'departments', id);
    const snapshot = await getDoc(departmentDoc);
    if(snapshot.exists()) {
        return serializeDoc(snapshot) as Department;
    }
    return null;
}

const uploadDepartmentImage = async (name: string, imageFile: string) => {
    if (!imageFile.startsWith('data:image')) {
        return imageFile; // It's already a URL, return it
    }
    const storageRef = ref(storage, `departments/${name.replace(/\s/g, '_')}-${Date.now()}`);
    await uploadString(storageRef, imageFile, 'data_url');
    return await getDownloadURL(storageRef);
};

export const createDepartment = async (department: Omit<Department, 'id' | 'imageUrl'>, imageFile: string | null) => {
  if (!imageFile) {
    throw new Error('Image is required for creating a department.');
  }
  const imageUrl = await uploadDepartmentImage(department.name, imageFile);
  const { name, status } = department;
  const docRef = await addDoc(departmentsCollection, { name, status, imageUrl });
  return { id: docRef.id };
};

export const updateDepartment = async (id: string, department: Partial<Omit<Department, 'id'>>, imageFile?: string | null) => {
  const departmentDocRef = doc(db, 'departments', id);
  const departmentDoc = await getDoc(departmentDocRef);

  if (!departmentDoc.exists()) {
    throw new Error("Department not found");
  }

  const oldData = departmentDoc.data();
  const updateData: Partial<Department> = { ...department };
  
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

    const newImageUrl = await uploadDepartmentImage(department.name || oldData.name, imageFile);
    updateData.imageUrl = newImageUrl;
  }
  
  await updateDoc(departmentDocRef, updateData);
};


export const deleteDepartment = async (id: string) => {
    const departmentDocRef = doc(db, 'departments', id);
    const departmentDoc = await getDoc(departmentDocRef);
    if (departmentDoc.exists()) {
        const data = departmentDoc.data();
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
  await deleteDoc(departmentDocRef);
};

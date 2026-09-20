

import { db, storage } from './firebase';
import {
  collection,
  getDocs,
  getDocsFromServer,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
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
  image64?: string;
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
  
  const imageUrl =
    (data.imageUrl && !data.imageUrl.startsWith('data:image') ? data.imageUrl : null) ||
    (data.image && !data.image.startsWith('data:image') ? data.image : null) ||
    data.image64 ||
    data.imageUrl ||
    data.image ||
    '';

  const { image: _image, image64: _image64, ...rest } = data;

  return {
    id: doc.id,
    ...rest,
    imageUrl,
  };
}

export const getDepartments = async (options?: { fromServer?: boolean }): Promise<Department[]> => {
  const snapshot = options?.fromServer
    ? await getDocsFromServer(departmentsCollection)
    : await getDocs(departmentsCollection);
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
    return imageFile;
  }

  const storageRef = ref(storage, `departments/${name.replace(/\s/g, '_')}-${Date.now()}`);
  await uploadString(storageRef, imageFile, 'data_url');
  return await getDownloadURL(storageRef);
};

export const createDepartment = async (department: Omit<Department, 'id' | 'imageUrl' | 'image64'>, imageFile: string | null) => {
  if (!imageFile) {
    throw new Error('Image is required for creating a department.');
  }
  const imageUrl = await uploadDepartmentImage(department.name, imageFile);
  const { name, status } = department;
  const docRef = await addDoc(departmentsCollection, {
    name,
    status,
    imageUrl,
  });
  return { id: docRef.id };
};

export const updateDepartment = async (id: string, department: Partial<Omit<Department, 'id'>>, imageFile?: string | null) => {
  const departmentDocRef = doc(db, 'departments', id);
  const departmentDoc = await getDoc(departmentDocRef);

  if (!departmentDoc.exists()) {
    throw new Error('Department not found');
  }

  const oldData = departmentDoc.data();
  const updateData: any = { ...department };
  let nextImageUrl: string | undefined;
  
  if (imageFile) {
    if (oldData?.imageUrl?.includes('firebasestorage.googleapis.com')) {
      try {
        const oldImageRef = ref(storage, oldData.imageUrl);
        await deleteObject(oldImageRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.error('Failed to delete old image:', error);
        }
      }
    }

    nextImageUrl = await uploadDepartmentImage(department.name || oldData.name, imageFile);
    updateData.imageUrl = nextImageUrl;
    updateData.image64 = deleteField();
    updateData.image = deleteField();
  }
  
  await updateDoc(departmentDocRef, updateData);

  return {
    imageUrl: nextImageUrl ?? oldData.imageUrl ?? '',
  };
};


export const deleteDepartment = async (id: string) => {
  const departmentDocRef = doc(db, 'departments', id);
  const departmentDoc = await getDoc(departmentDocRef);

  if (departmentDoc.exists()) {
    const data = departmentDoc.data();
    if (data.imageUrl?.includes('firebasestorage.googleapis.com')) {
      try {
        const imageRef = ref(storage, data.imageUrl);
        await deleteObject(imageRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.error('Error deleting image from storage:', error);
        }
      }
    }
  }

  await deleteDoc(departmentDocRef);
};

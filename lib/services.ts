
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
import { getServiceDetails } from './firebaseService/service-details';
import { deleteObject, ref } from 'firebase/storage';
import { getDepartments } from './departments';
import { getCategories } from './categories';
import { getSubCategories } from './sub-categories';

const servicesCollection = collection(db, 'services');

export type Service = {
  id?: string;
  name: string;
  categoryId: string;
  subCategoryId: string;
  departmentId: string;
  basePrice?: number;
  description: string;
  status: 'Active' | 'Inactive';
  deliveryTime?: number;
  vendorAmount?: number;
  formId?: string;
  imageUrl?: string;
  // For display purposes, not stored in the database
  categoryName?: string;
  subCategoryName?: string;
  departmentName?: string;
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

export const getServices = async (): Promise<Service[]> => {
  const [snapshot, departments, categories, subCategories] = await Promise.all([
    getDocs(servicesCollection),
    getDepartments(),
    getCategories(),
    getSubCategories(),
  ]);

  const departmentsMap = new Map(departments.map(d => [d.id, d.name]));
  const categoriesMap = new Map(categories.map(c => [c.id, c.name]));
  const subCategoriesMap = new Map(subCategories.map(sc => [sc.id, sc.name]));
  
  const services = snapshot.docs.map(doc => {
      const data = serializeDoc(doc) as Service;
      data.departmentName = departmentsMap.get(data.departmentId);
      data.categoryName = categoriesMap.get(data.categoryId);
      data.subCategoryName = subCategoriesMap.get(data.subCategoryId);
      return data;
  });
  return services;
};

export const getServiceById = async (id: string): Promise<Service | null> => {
    const serviceDoc = doc(db, 'services', id);
    const snapshot = await getDoc(serviceDoc);
    if(snapshot.exists()) {
        const serviceData = serializeDoc(snapshot) as Service;

        const [department, category, subCategory] = await Promise.all([
          serviceData.departmentId ? getDoc(doc(db, 'departments', serviceData.departmentId)) : Promise.resolve(null),
          serviceData.categoryId ? getDoc(doc(db, 'categories', serviceData.categoryId)) : Promise.resolve(null),
          serviceData.subCategoryId ? getDoc(doc(db, 'sub-categories', serviceData.subCategoryId)) : Promise.resolve(null),
        ]);

        serviceData.departmentName = department?.exists() ? department.data().name : 'N/A';
        serviceData.categoryName = category?.exists() ? category.data().name : 'N/A';
        serviceData.subCategoryName = subCategory?.exists() ? subCategory.data().name : 'N/A';
        
        return serviceData;
    }
    return null;
}

export const createService = async (service: Partial<Omit<Service, 'id'>>) => {
  const { name, categoryId, subCategoryId, departmentId, status, imageUrl, basePrice } = service;
  const docData = {
    name,
    categoryId,
    subCategoryId,
    departmentId,
    status,
    imageUrl: imageUrl === undefined ? null : imageUrl,
    basePrice: basePrice || 0,
  };
  const docRef = await addDoc(servicesCollection, docData);
  return { id: docRef.id };
};

export const updateService = async (id: string, service: Partial<Omit<Service, 'id'>>) => {
  const serviceDoc = doc(db, 'services', id);
  const updateData = { ...service };
  if ('imageUrl' in updateData && updateData.imageUrl === undefined) {
    updateData.imageUrl = null;
  }
  await updateDoc(serviceDoc, updateData);
};

export const deleteService = async (id: string) => {
    const serviceDocRef = doc(db, 'services', id);
    const serviceDetails = await getServiceDetails(id);
    
    if (serviceDetails) {
        const filesToDelete: (string | null)[] = [
            serviceDetails.bannerImage,
            serviceDetails.videoUrl,
            serviceDetails.videoThumbnailUrl
        ];

        for (const fileUrl of filesToDelete) {
            if (fileUrl) {
                try {
                    const fileRef = ref(storage, fileUrl);
                    await deleteObject(fileRef);
                } catch (error: any) {
                    if (error.code !== 'storage/object-not-found') {
                        console.error(`Failed to delete file ${fileUrl}:`, error);
                    }
                }
            }
        }
    }

    return await deleteDoc(serviceDocRef);
};

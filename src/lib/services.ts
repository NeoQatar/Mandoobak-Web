
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
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import * as firebaseStorage from 'firebase/storage';
// @ts-ignore
const { ref, uploadBytes, getDownloadURL, deleteObject } = firebaseStorage;
import { getDepartments } from './departments';
import { getCategories } from './categories';
import { getSubCategories } from './sub-categories';
import { getVendorsFromUsers } from './users';

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
  commissionPercent?: number;
  vendorId?: string;       // legacy single-vendor field (kept for backward compat)
  vendorIds?: string[];    // multi-vendor: list of assigned vendor userIds
  vendorCommissions?: Record<string, number>; // per-vendor commission %
  isPopular?: boolean;
  slug?: string;
  // For display purposes, not stored in the database
  categoryName?: string;
  subCategoryName?: string;
  departmentName?: string;
  vendorName?: string;
  vendorCount?: number;
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

export const getServices = async (): Promise<Service[]> => {
  const [snapshot, departments, categories, subCategories, vendors] = await Promise.all([
    getDocs(servicesCollection),
    getDepartments(),
    getCategories(),
    getSubCategories(),
    getVendorsFromUsers(),
  ]);

  const departmentsMap = new Map(departments.map(d => [d.id!, d.name]));
  const categoriesMap = new Map(categories.map(c => [c.id!, c.name]));
  const subCategoriesMap = new Map(subCategories.map(sc => [sc.id!, sc.name]));
  const vendorsMap = new Map(vendors.map(v => [v.userid, v.name]));

  const services = snapshot.docs.map(doc => {
      const data = serializeDoc(doc) as Service;
      data.departmentName = departmentsMap.get(data.departmentId);
      data.categoryName = categoriesMap.get(data.categoryId);
      data.subCategoryName = subCategoriesMap.get(data.subCategoryId);
      const ids = Array.from(new Set([...(data.vendorIds || []), ...(data.vendorId ? [data.vendorId] : [])]));
      data.vendorCount = ids.length;
      if (ids.length === 1) {
        data.vendorName = vendorsMap.get(ids[0]) || 'N/A';
      } else if (ids.length > 1) {
        data.vendorName = `${ids.length} vendors`;
      }
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

        if (serviceData.vendorId) {
          const vendorDoc = await getDoc(doc(db, 'Users', serviceData.vendorId));
          serviceData.vendorName = vendorDoc?.exists() ? vendorDoc.data().name : 'N/A';
        }

        return serviceData;
    }
    return null;
}

export const createService = async (service: Partial<Omit<Service, 'id'>>, imageFile?: File | null) => {
  const { name, categoryId, subCategoryId, departmentId, status, basePrice, commissionPercent, vendorId, isPopular, slug } = service;

  // 1. Create document with placeholder image to get ID
  const docData: Record<string, any> = {
    name,
    categoryId,
    subCategoryId,
    departmentId,
    status,
    imageUrl: null,
    basePrice: basePrice || 0,
    description: '',
    commissionPercent: commissionPercent || 0,
    vendorId: vendorId || '',
    isPopular: isPopular || false,
    slug: slug || '',
  };
  const docRef = await addDoc(servicesCollection, docData);
  const docId = docRef.id;

  if (imageFile) {
    // 2. Upload image to services/{docId}/{filename}
    const storageRef = ref(storage, `services/${docId}/${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(snapshot.ref);

    // 3. Update document with real image URL
    await updateDoc(docRef, { imageUrl });
  }
  
  return { id: docRef.id };
};

export const updateService = async (id: string, service: Partial<Omit<Service, 'id'>>, imageFile?: File | null) => {
  const serviceDocRef = doc(db, 'services', id);
  const serviceDoc = await getDoc(serviceDocRef);

  if (!serviceDoc.exists()) {
    throw new Error("Service not found");
  }

  const updateData: any = { ...service };
  
  if (imageFile) {
    // Upload new image to services/{docId}/{filename}
    const storageRef = ref(storage, `services/${id}/${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(snapshot.ref);
    updateData.imageUrl = imageUrl;

    // Delete old image if it exists and is a storage URL
    const oldImageUrl = serviceDoc.data()?.imageUrl;
    if (oldImageUrl && oldImageUrl.includes('firebasestorage')) {
        try {
            const oldImageRef = ref(storage, oldImageUrl);
            await deleteObject(oldImageRef);
        } catch (e) {
            console.error("Failed to delete old image:", e);
        }
    }
  }
  
  await updateDoc(serviceDocRef, updateData);
};

export const assignVendorToService = async (serviceId: string, vendorId: string, commission: number) => {
  const ref = doc(db, 'services', serviceId);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  // Migrate legacy single vendorId into the array so it isn't lost
  const legacyId: string | undefined = data.vendorId;
  const updateData: Record<string, any> = {
    [`vendorCommissions.${vendorId}`]: commission,
  };
  if (legacyId && legacyId !== vendorId) {
    updateData.vendorIds = arrayUnion(legacyId, vendorId);
  } else {
    updateData.vendorIds = arrayUnion(vendorId);
  }
  await updateDoc(ref, updateData);
};

export const unassignVendorFromService = async (serviceId: string, vendorId: string) => {
  const ref = doc(db, 'services', serviceId);
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  const commissions = { ...(data.vendorCommissions || {}) };
  delete commissions[vendorId];
  await updateDoc(ref, {
    vendorIds: arrayRemove(vendorId),
    vendorCommissions: commissions,
  });
};

export const updateVendorCommission = async (serviceId: string, vendorId: string, commission: number) => {
  const ref = doc(db, 'services', serviceId);
  await updateDoc(ref, { [`vendorCommissions.${vendorId}`]: commission });
};

export const deleteService = async (id: string, imageUrl?: string) => {
    // Delete image from storage if applicable
    if (imageUrl && imageUrl.includes('firebasestorage')) {
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (e) {
            console.error("Failed to delete image from storage:", e);
        }
    }

    const serviceDocRef = doc(db, 'services', id);
    return await deleteDoc(serviceDocRef);
};

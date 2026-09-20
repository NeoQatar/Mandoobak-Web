
'use server';

import {db} from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  serverTimestamp,
  Timestamp,
  collectionGroup,
  setDoc,
} from 'firebase/firestore';
import type {Form, FormResponse} from '@/types/forms';

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

export async function createServiceRequirementsForm(serviceId: string, formData: Omit<Form, 'id' | 'serviceId'>): Promise<string> {
    const requirementsCollection = collection(db, 'services', serviceId, 'requirements');
    const docRef = await addDoc(requirementsCollection, {
        ...formData,
        serviceId: serviceId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function createNewFormForService(serviceId: string, name: string, order: number): Promise<string> {
    const requirementsCollection = collection(db, 'services', serviceId, 'requirements');
    const newForm: Omit<Form, 'id'| 'serviceId'> = {
        name,
        description: 'A new form for this service.',
        elements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order,
    };
    const docRef = await addDoc(requirementsCollection, {
        ...newForm,
        serviceId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
}


export async function updateForm(
  serviceId: string,
  formId: string,
  formData: Partial<Omit<Form, 'id'>>
): Promise<void> {
  const formDoc = doc(db, 'services', serviceId, 'requirements', formId);
  const updateData: Record<string, any> = { ...formData };
  
  if (!('updatedAt' in formData)) {
    updateData.updatedAt = serverTimestamp();
  }

  await updateDoc(formDoc, updateData);
}

export async function getForm(serviceId: string, formId: string): Promise<Form> {
  const formDoc = doc(db, 'services', serviceId, 'requirements', formId);
  const formSnapshot = await getDoc(formDoc);
  if (!formSnapshot.exists()) {
    throw new Error('Form not found');
  }
  return serializeDoc(formSnapshot) as Form;
}

export async function getFormsForService(serviceId: string): Promise<Form[]> {
  if (!serviceId) return [];
  const requirementsCollection = collection(db, 'services', serviceId, 'requirements');
  const q = query(requirementsCollection, where('serviceId', '==', serviceId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => serializeDoc(doc) as Form).filter(Boolean);
}


export async function getAllForms(): Promise<Form[]> {
  const formsQuery = query(collectionGroup(db, 'requirements'));
  const snapshot = await getDocs(formsQuery);
  return snapshot.docs.map(doc => {
      const data = serializeDoc(doc) as Form;
      if (data && !data.serviceId) {
          // If serviceId is not in the data, get it from the parent doc ref path
          const pathParts = doc.ref.path.split('/');
          const servicesIndex = pathParts.indexOf('services');
          if (servicesIndex > -1 && servicesIndex + 1 < pathParts.length) {
              data.serviceId = pathParts[servicesIndex + 1];
          }
      }
      return data;
  }).filter(Boolean);
}

export async function deleteForm(serviceId: string, formId: string, remainingForms: Form[]): Promise<void> {
  const batch = writeBatch(db);
  
  const formDoc = doc(db, 'services', serviceId, 'requirements', formId);
  batch.delete(formDoc);

  // Re-order remaining forms
  remainingForms
    .sort((a,b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((form, index) => {
        const formRef = doc(db, 'services', serviceId, 'requirements', form.id!);
        batch.update(formRef, { order: index });
    });

  const responsesCollection = collection(db, 'services', serviceId, 'requirements', formId, 'responses');
  const responsesSnapshot = await getDocs(responsesCollection);
  responsesSnapshot.forEach(responseDoc => {
    batch.delete(responseDoc.ref);
  });

  await batch.commit();
}


export async function addFormResponse(
  serviceId: string,
  formId: string,
  responseData: Record<string, any>
): Promise<string> {
  const responsesCollection = collection(db, 'services', serviceId, 'requirements', formId, 'responses');
  const newResponseRef = doc(responsesCollection);
  await setDoc(newResponseRef, {
    data: responseData,
    submittedAt: serverTimestamp(),
  });
  return newResponseRef.id;
}

export async function getFormResponses(serviceId: string, formId: string): Promise<FormResponse[]> {
  const responsesCollection = collection(db, 'services', serviceId, 'requirements', formId, 'responses');
  const snapshot = await getDocs(responsesCollection);
  return snapshot.docs.map(doc => serializeDoc(doc) as FormResponse);
}

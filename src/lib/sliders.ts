
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
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';

const slidersCollection = collection(db, 'sliders');

export type Slider = {
  id?: string;
  title: string;
  description: string;
  imageUrl: string; // Base64 string or URL
  sortOrder: number;
  status: 'Active' | 'Inactive';
};

// Helper function to safely serialize Firestore data
const serializeDoc = (doc: any) => {
  const data = doc.data();
  if (!data) return null;
  // Convert timestamps to ISO strings if needed (though not specified in the requirements)
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  // Map legacy image to imageUrl if necessary
  if (data.image && !data.imageUrl) {
    data.imageUrl = data.image;
  }
  return { id: doc.id, ...data };
};

export const getSliders = async (): Promise<Slider[]> => {
  const q = query(slidersCollection, orderBy('sortOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => serializeDoc(doc) as Slider).filter(Boolean);
};

export const getSliderById = async (id: string): Promise<Slider | null> => {
  const sliderDocRef = doc(db, 'sliders', id);
  const snapshot = await getDoc(sliderDocRef);
  if (snapshot.exists()) {
    return serializeDoc(snapshot) as Slider;
  }
  return null;
};

export const createSlider = async (slider: Omit<Slider, 'id'>) => {
  const docRef = await addDoc(slidersCollection, slider);
  return { id: docRef.id };
};

export const updateSlider = async (id: string, slider: Partial<Omit<Slider, 'id'>>) => {
  const sliderDocRef = doc(db, 'sliders', id);
  await updateDoc(sliderDocRef, slider);
};

export const deleteSlider = async (id: string) => {
  const sliderDocRef = doc(db, 'sliders', id);
  await deleteDoc(sliderDocRef);
};

export const updateSlidersOrder = async (sliders: { id: string; sortOrder: number }[]) => {
  const batch = writeBatch(db);
  sliders.forEach(({ id, sortOrder }) => {
    const sliderRef = doc(db, 'sliders', id);
    batch.update(sliderRef, { sortOrder });
  });
  await batch.commit();
};

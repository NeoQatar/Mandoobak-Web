'use server';

import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
  limit,
  where,
} from 'firebase/firestore';

const logsCollection = collection(db, 'activityLogs');

export type ActivityLog = {
  id?: string;
  action: string;
  description: string;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  targetUserId?: string;
  targetUserName?: string;
  category: 'auth' | 'profile' | 'order' | 'service' | 'vendor' | 'system';
  createdAt: string;
};

const serializeDoc = (doc: any) => {
  const data = doc.data();
  if (!data) return null;
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return { id: doc.id, ...data };
};

export async function getActivityLogs(maxLogs: number = 200): Promise<ActivityLog[]> {
  const q = query(logsCollection, orderBy('createdAt', 'desc'), limit(maxLogs));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(serializeDoc).filter(Boolean) as ActivityLog[];
}

export async function getActivityLogsByUser(userId: string): Promise<ActivityLog[]> {
  const q = query(logsCollection, where('performedBy', '==', userId), orderBy('createdAt', 'desc'), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(serializeDoc).filter(Boolean) as ActivityLog[];
}

export async function logActivity(data: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(logsCollection, {
    ...data,
    createdAt: new Date().toISOString(),
  });
}

'use server';

import { db } from './firebase';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  Timestamp,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';

export type VendorPayment = {
  id?: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  orderIds: string[];
  orderCount: number;
  month: string;
  note?: string;
  attachmentUrl?: string;
  status: 'Paid' | 'Pending';
  paidAt?: string;
  createdAt: string;
  paymentMethod?: string;
  authNumber?: string;
  transactionNumber?: string;
  bankCardNumber?: string;
  location?: string;
};

const paymentsCollection = collection(db, 'vendorPayments');

const serializeDoc = (d: any): VendorPayment => {
  const data = d.data();
  for (const key in data) {
    if (data[key] instanceof Timestamp) data[key] = data[key].toDate().toISOString();
  }
  return { id: d.id, ...data } as VendorPayment;
};

export async function getVendorPayments(vendorId: string): Promise<VendorPayment[]> {
  const q = query(paymentsCollection, where('vendorId', '==', vendorId));
  const snap = await getDocs(q);
  const results = snap.docs.map(serializeDoc);
  return results.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export async function createVendorPayment(data: Omit<VendorPayment, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(paymentsCollection, {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getVendorPaymentById(paymentId: string): Promise<VendorPayment | null> {
  const snap = await getDoc(doc(db, 'vendorPayments', paymentId));
  if (!snap.exists()) return null;
  return serializeDoc(snap);
}

export async function markVendorPaymentPaid(paymentId: string): Promise<void> {
  await updateDoc(doc(db, 'vendorPayments', paymentId), {
    status: 'Paid',
    paidAt: new Date().toISOString(),
  });
}

export async function deleteVendorPayment(paymentId: string): Promise<void> {
  await deleteDoc(doc(db, 'vendorPayments', paymentId));
}

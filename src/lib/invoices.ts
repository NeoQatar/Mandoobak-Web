
'use server';
import { db } from './firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  query,
  where,
  writeBatch,
  addDoc,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { Order, OrderWithDetails, getOrders, getOrderById } from './orders';
import { format } from 'date-fns';
import { getServices, getServiceById } from './services';

const invoicesCollection = collection(db, 'invoices');
const countersCollection = collection(db, 'counters');

export type Invoice = {
  id?: string;
  invoiceNumber: string;
  orderId: string;
  companyName: string;
  phone: string;
  date: string;
  numberOfOrders: number;
  status: 'Paid' | 'Unpaid';
  amount: number;
};

export type InvoiceWithOrderDetails = Invoice & {
    serviceName: string;
    totalPrice: number;
    commissionpercent?: number;
    vendorId?: string;
    orderStatus?: string;
}

// Helper function to safely serialize Firestore data
const serializeDoc = (doc: any) => {
  const data = doc.data();
  if (!data) return null;
  // Convert Firestore Timestamps to ISO strings
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
  }
  return { id: doc.id, ...data };
};

export const getInvoices = async (): Promise<InvoiceWithOrderDetails[]> => {
    const [snapshot, services] = await Promise.all([
        getDocs(invoicesCollection),
        getServices()
    ]);
    const servicesMap = new Map(services.map(s => [s.id, s.name]));

    const invoices = snapshot.docs.map(doc => {
        const data = serializeDoc(doc) as Invoice;
        return {
            ...data,
            serviceName: 'Service Name Here', // Placeholder
            totalPrice: 0,
        };
    });

    // To get the service name, we must fetch the order details
    const detailedInvoices = await Promise.all(invoices.map(async (invoice) => {
        const order = await getOrderById(invoice.orderId);
        return {
            ...invoice,
            serviceName: order?.serviceDetails?.name || 'Unknown Service',
            totalPrice: order?.totalPrice || 0,
            commissionpercent: order?.commissionpercent,
            vendorId: order?.vendorId,
            orderStatus: order?.orderStatus,
        };
    }));


    return detailedInvoices;
};

export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
    const invoiceDoc = doc(db, 'invoices', id);
    const snapshot = await getDoc(invoiceDoc);
    if(snapshot.exists()) {
        return serializeDoc(snapshot) as Invoice;
    }
    return null;
}

const serializeOrderDoc = async (d: any): Promise<Order> => {
    const data = d.data();
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    const orderData = { id: d.id, ...data } as Order;
    if (orderData.serviceId) {
        const service = await getServiceById(orderData.serviceId);
        orderData.serviceDetails = service;
    }
    return orderData;
};

export const getOrdersForInvoice = async (orderId: string, invoiceId?: string): Promise<Order[]> => {
    const ordersCol = collection(db, 'orders');

    // Strategy 1: reverse lookup — orders that reference this invoice ID
    if (invoiceId) {
        const q = query(ordersCol, where('invoiceId', '==', invoiceId));
        const snap = await getDocs(q);
        if (!snap.empty) return Promise.all(snap.docs.map(serializeOrderDoc));
    }

    if (!orderId) return [];

    // Strategy 2: direct doc fetch by Firestore document ID
    try {
        const orderSnap = await getDoc(doc(db, 'orders', orderId));
        if (orderSnap.exists()) return [await serializeOrderDoc(orderSnap)];
    } catch {}

    // Strategy 3: query by orderId field (human-readable order number)
    const q2 = query(ordersCol, where('orderId', '==', orderId));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) return Promise.all(snap2.docs.map(serializeOrderDoc));

    return [];
}


export const updateInvoiceStatus = async (id: string, status: 'Paid' | 'Unpaid') => {
  const invoiceDoc = doc(db, 'invoices', id);
  await updateDoc(invoiceDoc, { status });
};

async function getNextInvoiceNumber(): Promise<string> {
    const counterRef = doc(countersCollection, 'invoices');
    
    try {
        const nextNumber = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let nextId = 1;
            
            if (counterDoc.exists()) {
                const currentData = counterDoc.data();
                // Check multiple possible field names or just lastId
                const lastId = currentData.lastId || currentData.count || 0;
                nextId = Number(lastId) + 1;
                transaction.update(counterRef, { lastId: nextId });
            } else {
                transaction.set(counterRef, { lastId: 1 });
            }
            
            return nextId;
        });

        return `INV-${String(nextNumber).padStart(4, '0')}`;
    } catch (e) {
        console.error("Transaction failed: ", e);
        // Fallback or re-throw
        throw e;
    }
}


export const createInvoiceFromOrder = async (order: OrderWithDetails, status: 'Paid' | 'Unpaid' = 'Unpaid'): Promise<string> => {
    const invoiceNumber = await getNextInvoiceNumber();

    const amount = (order.commissionpercent && order.commissionpercent > 0)
        ? (order.totalPrice * (100 - order.commissionpercent)) / 100
        : order.totalPrice;

    const newInvoice: Omit<Invoice, 'id'> = {
        invoiceNumber,
        orderId: order.id!,
        companyName: order.customerName,
        phone: order.customerPhone,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        numberOfOrders: 1, 
        status: status,
        amount: amount,
    };
    
    const invoiceDocRef = await addDoc(invoicesCollection, newInvoice);

    // Update the order with the new invoice ID
    const orderDocRef = doc(db, 'orders', order.id!);
    await updateDoc(orderDocRef, { invoiceId: invoiceDocRef.id });

    return invoiceDocRef.id;
}

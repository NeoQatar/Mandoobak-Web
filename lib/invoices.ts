
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
import { getServices } from './services';

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
            commissionpercent: order?.commissionpercent
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

export const getOrdersForInvoice = async (orderId: string): Promise<Order[]> => {
    if (!orderId) return [];
    const order = await getOrderById(orderId);
    return order ? [order] : [];
}


export const updateInvoiceStatus = async (id: string, status: 'Paid' | 'Unpaid') => {
  const invoiceDoc = doc(db, 'invoices', id);
  await updateDoc(invoiceDoc, { status });
};

async function getNextInvoiceNumber(): Promise<string> {
    const counterRef = doc(countersCollection, 'invoices');
    let newInvoiceNumber;
    
    try {
        await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists()) {
                newInvoiceNumber = 1;
                transaction.set(counterRef, { lastId: 1 });
            } else {
                newInvoiceNumber = counterDoc.data().lastId + 1;
                transaction.update(counterRef, { lastId: newInvoiceNumber });
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }

    if (newInvoiceNumber === undefined) {
        throw new Error("Failed to generate invoice number.");
    }
    
    return `INV-${String(newInvoiceNumber).padStart(4, '0')}`;
}


export const createInvoiceFromOrder = async (order: OrderWithDetails): Promise<string> => {
    const invoiceNumber = await getNextInvoiceNumber();

    const amount = (order.commissionpercent && order.commissionpercent > 0)
        ? (order.totalPrice * order.commissionpercent) / 100
        : order.totalPrice;

    const newInvoice: Omit<Invoice, 'id'> = {
        invoiceNumber,
        orderId: order.id!,
        companyName: order.customerName,
        phone: order.customerPhone,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        numberOfOrders: 1, 
        status: 'Unpaid',
        amount: amount,
    };
    
    const invoiceDocRef = await addDoc(invoicesCollection, newInvoice);

    // Update the order with the new invoice ID
    const orderDocRef = doc(db, 'orders', order.id!);
    await updateDoc(orderDocRef, { invoiceId: invoiceDocRef.id });

    return invoiceDocRef.id;
}

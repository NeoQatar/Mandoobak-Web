
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
  runTransaction,
  increment,
  setDoc,
  arrayUnion,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getServices, getServiceById, Service } from './services';
import { getUsers, User } from './users';
import { getServiceDetails, ServiceDetails } from './firebaseService/service-details';
import { add, differenceInDays, format, startOfDay } from 'date-fns';
import { ref, deleteObject } from 'firebase/storage';


const ordersCollection = collection(db, 'orders');
const usersCollection = collection(db, 'Users');

export type OrderStatus = 'Order Created' | 'Order Inprogress' | 'Order Completed' | 'Cancelled';
export type DocumentStatus = 'Documents Pending' | 'Documents Uploaded' | 'Documents Approved' | 'Additional Documents Required' | 'Documents Delivered';

export type Order = {
  id?: string;
  orderdocId: string;
  orderId: string;
  customerId: string;
  vendorId?: string;
  serviceId: string;
  orderStatus: OrderStatus;
  documentStatus: DocumentStatus;
  createdAt: Timestamp | string;
  assignedAt?: Timestamp | string;
  basePrice: number;
  statusHistory?: { status: OrderStatus | DocumentStatus; date: string; type: 'order' | 'document' }[];
  invoiceId?: string;
  serviceDetails?: any;
  commissionpercent?: number;
  totalPrice: number;
  paymentStatus?: 'Paid' | 'Unpaid';
  imageUrl?: string;
};

export type OrderWithDetails = Order & {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerProfileImageUrl?: string;
  vendorName: string;
  vendorPhone: string;
  vendorEmail: string;
  vendorProfileImageUrl?: string;
  serviceName: string;
  departmentName: string;
  categoryName: string;
  subCategoryName: string;
  price: number;
  discount: number;
  vendorAmount: number;
  serviceStartDate: string;
  serviceEndDate: string;
  remainingDays: number;
};

const serializeDoc = (doc: any) => {
  const data = doc.data();
  if (!data) return null;
  const id = doc.id;
  const serializedData = { id, ...data };
  for (const key in serializedData) {
    if (serializedData[key] instanceof Timestamp) {
      serializedData[key] = serializedData[key].toDate().toISOString();
    }
  }
  if (serializedData.orderdocId !== id) {
    serializedData.orderdocId = id;
  }
  return serializedData;
}

export const getOrdersWithDetails = async (): Promise<OrderWithDetails[]> => {
  const [ordersSnapshot, allUsers, services] = await Promise.all([
    getDocs(ordersCollection),
    getUsers(),
    getServices()
  ]);

  const usersMap = new Map<string, typeof allUsers[number]>();
  allUsers.forEach(u => {
    if ((u as any).userid) usersMap.set((u as any).userid, u);
    if ((u as any).id) usersMap.set((u as any).id, u);
  });
  const servicesMap = new Map(services.map(s => [s.id, s]));

  // Pre-serialize all orders to collect missing user IDs
  const orderDocs = ordersSnapshot.docs
    .map(d => {
      const result = serializeDoc(d);
      if (!result) console.warn('[orders.ts] serializeDoc returned null for doc:', d.id);
      return result;
    })
    .filter(Boolean) as Order[];

  console.log('[orders.ts] After serializeDoc + filter null:', orderDocs.length);

  // Find customer/vendor IDs that weren't matched in the bulk users fetch
  const missingUserIds = new Set<string>();
  for (const o of orderDocs) {
    if (o.customerId && !usersMap.has(o.customerId)) missingUserIds.add(o.customerId);
    if (o.vendorId && !usersMap.has(o.vendorId)) missingUserIds.add(o.vendorId);
  }

  // Fall back to direct document fetches by doc ID for missing users
  if (missingUserIds.size > 0) {
    const fetched = await Promise.all(
      Array.from(missingUserIds).map(async (uid) => {
        try {
          const ref = doc(db, 'Users', uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as any;
            for (const key in data) {
              if (data[key] instanceof Timestamp) {
                data[key] = data[key].toDate().toISOString();
              }
            }
            return { id: snap.id, ...data, lookupId: uid };
          }
        } catch {}
        return null;
      })
    );
    fetched.forEach((u: any) => {
      if (u) {
        usersMap.set(u.lookupId, u);
        if (u.userid) usersMap.set(u.userid, u);
        if (u.id) usersMap.set(u.id, u);
      }
    });
  }

  // DEBUG: log which customers can't be resolved
  const unresolved = orderDocs
    .filter(o => o.customerId && !usersMap.get(o.customerId))
    .map(o => ({ orderId: o.orderId, customerId: o.customerId }));
  if (unresolved.length > 0) {
    console.log('[orders] Unresolved customer IDs:', unresolved);
    console.log('[orders] Available user IDs sample:', Array.from(usersMap.keys()).slice(0, 10));
  }

  const detailedOrders = orderDocs.map(orderData => {
    const customer = usersMap.get(orderData.customerId);
    const vendor = orderData.vendorId ? usersMap.get(orderData.vendorId) : undefined;
    const service = servicesMap.get(orderData.serviceId);

    return {
      ...orderData,
      customerName: customer?.name || 'Unknown User',
      customerPhone: customer?.phoneNumber || 'N/A',
      customerEmail: customer?.email || 'N/A',
      serviceName: service?.name || 'Unknown Service',
      vendorName: vendor?.name || 'N/A',
      departmentName: service?.departmentName || 'N/A',
      categoryName: service?.categoryName || 'N/A',
      subCategoryName: service?.subCategoryName || 'N/A',
      totalPrice: orderData.totalPrice || service?.basePrice || 0,
      commissionpercent: orderData.commissionpercent,
      paymentStatus: orderData.paymentStatus || 'Unpaid',
      vendorAmount: (orderData.commissionpercent && orderData.commissionpercent > 0)
        ? ((orderData.totalPrice || service?.basePrice || 0) * (100 - orderData.commissionpercent)) / 100
        : (orderData.totalPrice || service?.basePrice || 0),
    } as OrderWithDetails;
  });

  return detailedOrders;
};

export const getOrderDetailsById = async (id: string): Promise<OrderWithDetails | null> => {
  const orderDocRef = doc(db, 'orders', id);
  const orderSnapshot = await getDoc(orderDocRef);

  if (!orderSnapshot.exists()) {
    return null;
  }

  const orderData = serializeDoc(orderSnapshot) as Order;

  if (!orderData) return null;

  const customerQuery = query(usersCollection, where("userid", "==", orderData.customerId), where("type", "==", "customer"));
  const customerSnapshot = await getDocs(customerQuery);
  const customer = customerSnapshot.docs.length > 0 ? serializeDoc(customerSnapshot.docs[0]) as User : null;

  let vendor: User | null = null;
  if (orderData.vendorId) {
    const vendorQuery = query(usersCollection,
      where("userid", "==", orderData.vendorId),
      where("type", "==", "vendor")
    );
    const vendorSnapshot = await getDocs(vendorQuery);
    vendor = vendorSnapshot.docs.length > 0 ? serializeDoc(vendorSnapshot.docs[0]) as User : null;
  }

  const service = orderData.serviceId ? await getServiceById(orderData.serviceId) : null;
  const serviceDetails = orderData.serviceId ? await getServiceDetails(orderData.serviceId) : null;

  let serviceEndDate = 'N/A';
  let remainingDays = 0;

  if (serviceDetails && serviceDetails.highlightTitle && orderData.createdAt) {
    const daysMatch = serviceDetails.highlightTitle.match(/(\d+)/g);
    if (daysMatch) {
      const maxDays = Math.max(...daysMatch.map(Number));
      const startDate = startOfDay(new Date(orderData.createdAt as string));
      const endDate = add(startDate, { days: maxDays });
      serviceEndDate = format(endDate, 'dd-MM-yyyy');
      remainingDays = differenceInDays(endDate, startOfDay(new Date()));
      if (remainingDays < 0) remainingDays = 0;
    }
  }


  return {
    ...orderData,
    id: orderSnapshot.id,
    customerName: customer?.name || 'Unknown User',
    customerPhone: customer?.phoneNumber || 'N/A',
    customerEmail: customer?.email || 'N/A',
    customerProfileImageUrl: customer?.profileImageUrl,
    vendorName: vendor?.name || 'N/A',
    vendorPhone: vendor?.phoneNumber || 'N/A',
    vendorEmail: vendor?.email || 'N/A',
    vendorProfileImageUrl: vendor?.profileImageUrl,
    serviceName: service?.name || 'Unknown Service',
    departmentName: service?.departmentName || 'N/A',
    categoryName: service?.categoryName || 'N/A',
    subCategoryName: service?.subCategoryName || 'N/A',
    price: service?.basePrice || 0,
    discount: 0,
    totalPrice: orderData.totalPrice || service?.basePrice || 0,
    commissionpercent: orderData.commissionpercent,
    paymentStatus: orderData.paymentStatus || 'Unpaid',
    vendorAmount: (orderData.commissionpercent && orderData.commissionpercent > 0)
      ? (orderData.totalPrice * (100 - orderData.commissionpercent)) / 100
      : orderData.totalPrice,
    serviceStartDate: orderData.createdAt ? format(new Date(orderData.createdAt as string), 'dd-MM-yyyy') : 'N/A',
    serviceEndDate: serviceEndDate,
    remainingDays: remainingDays,
  };
};


export const getOrders = async (): Promise<Order[]> => {
  const snapshot = await getDocs(ordersCollection);
  return snapshot.docs.map(doc => serializeDoc(doc) as Order).filter(Boolean);
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  const orderDoc = doc(db, 'orders', id);
  const snapshot = await getDoc(orderDoc);
  if (snapshot.exists()) {
    const orderData = serializeDoc(snapshot) as Order;
    if (orderData.serviceId) {
      const service = await getServiceById(orderData.serviceId);
      orderData.serviceDetails = service;
    }
    return orderData;
  }
  return null;
}

export const createOrder = async (orderInput: any) => {
  // This function needs to be updated to match the new simplified order structure.
  // For now, it's safer to throw an error or return a mock response.
  throw new Error("createOrder function is not implemented for the new data model yet.");
};


export const updateOrderStatuses = async (id: string, statuses: { orderStatus?: OrderStatus, documentStatus?: DocumentStatus, paymentStatus?: 'Paid' | 'Unpaid' }, vendorId?: string) => {
  const orderDoc = doc(db, 'orders', id);
  const updateData: any = { ...statuses };

  const historyEntries = [];
  if (statuses.orderStatus) {
    historyEntries.push({
      status: statuses.orderStatus,
      date: new Date().toISOString(),
      type: 'order'
    });
  }
  if (statuses.documentStatus) {
    historyEntries.push({
      status: statuses.documentStatus,
      date: new Date().toISOString(),
      type: 'document'
    });
  }

  if (historyEntries.length > 0) {
    updateData.statusHistory = arrayUnion(...historyEntries);
  }

  if (vendorId) {
    updateData.vendorId = vendorId;
    updateData.assignedAt = new Date().toISOString();
  }
  await updateDoc(orderDoc, updateData);
  return { id };
};

async function deleteCollection(collectionPath: string, batch: any) {
  const q = query(collection(db, collectionPath));
  const snapshot = await getDocs(q);

  if (snapshot.size === 0) {
    return;
  }

  snapshot.docs.forEach(docSnapshot => {
    batch.delete(docSnapshot.ref);
    // NOTE: This doesn't recursively delete sub-sub-collections in a single go.
    // Firestore subcollection deletes need to be handled carefully.
    // For this app's current structure, one level deep is sufficient.
  });
}


export const deleteOrder = async (id: string) => {
  const orderDocRef = doc(db, 'orders', id);
  const orderDoc = await getDoc(orderDocRef);

  if (!orderDoc.exists()) {
    console.warn(`Order with ID ${id} not found.`);
    return { id };
  }

  const orderData = orderDoc.data() as Order;

  // Delete associated image from storage, if it exists
  if (orderData.imageUrl) {
    try {
      const imageRef = ref(storage, orderData.imageUrl);
      await deleteObject(imageRef);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        console.error(`Failed to delete storage image ${orderData.imageUrl}:`, error);
        // We don't re-throw, to allow Firestore deletion to proceed
      }
    }
  }

  // Firestore's delete does not automatically delete subcollections.
  // We must do it manually.
  const batch = writeBatch(db);

  // Recursively delete subcollections (example: 'documents', 'payments', etc.)
  // This is a simplified version. A robust solution might need a cloud function for deep nesting.
  const subcollections = await getDocs(collection(db, `orders/${id}/documents`)); // Example subcollection
  subcollections.forEach(subDoc => {
    batch.delete(subDoc.ref);
  });

  // Finally, delete the main order document
  batch.delete(orderDocRef);

  await batch.commit();
  return { id };
};

export const updateOrderStatus = updateOrderStatuses;





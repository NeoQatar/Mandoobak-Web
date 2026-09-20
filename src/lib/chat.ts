import { db } from './firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  getDoc,
} from 'firebase/firestore';

export type Message = {
  id?: string;
  message: string;
  sentby: string;
  receivedby: string;
  timestamp: Timestamp | string;
  isread: boolean;
  senderName?: string;
  senderType?: 'admin' | 'vendor' | 'customer';
  imageUrl?: string;
};

export type VendorChat = {
  id?: string;
  customerId?: string;
  vendorId: string;
  orderId?: string;
  serviceId?: string;
  lastlyactive?: Timestamp | string;
  vendorName?: string;
  lastMessage?: string;
  unreadAdmin?: number;
  unreadVendor?: number;
};

const vendorChatsCollection = collection(db, 'vendorchats');
const customerChatsCollection = collection(db, 'customerchats');

const serializeTimestamp = (val: any): string => {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return val || '';
};

const serializeChat = (d: any): VendorChat => ({
  id: d.id,
  ...d.data(),
  lastlyactive: serializeTimestamp(d.data().lastlyactive),
});

// Admin: all customer-vendor order chats
export function subscribeToVendorChats(callback: (chats: VendorChat[]) => void) {
  return onSnapshot(customerChatsCollection, (snapshot) => {
    const chats = snapshot.docs.map(serializeChat);
    chats.sort((a, b) =>
      ((b.lastlyactive as string) || '') > ((a.lastlyactive as string) || '') ? 1 : -1
    );
    callback(chats);
  });
}

// Vendor: only their own chats (filtered by vendorId)
export function subscribeToMyVendorChats(vendorId: string, callback: (chats: VendorChat[]) => void) {
  const q = query(customerChatsCollection, where('vendorId', '==', vendorId));
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(serializeChat);
    chats.sort((a, b) =>
      ((b.lastlyactive as string) || '') > ((a.lastlyactive as string) || '') ? 1 : -1
    );
    callback(chats);
  });
}

// Messages in a customerchats conversation (subcollection: chats)
export function subscribeToVendorMessages(chatId: string, callback: (messages: Message[]) => void) {
  const messagesCol = collection(db, 'customerchats', chatId, 'chats');
  return onSnapshot(messagesCol, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      timestamp: serializeTimestamp(d.data().timestamp),
    })) as Message[];
    messages.sort((a, b) =>
      ((a.timestamp as string) > (b.timestamp as string) ? 1 : -1)
    );
    callback(messages);
  });
}

// Send a message — updates lastlyactive and lastMessage on the parent doc
export async function sendVendorMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  senderType: 'admin' | 'vendor' | 'customer',
  text: string,
  imageUrl?: string,
  receivedby?: string
) {
  const messagesCol = collection(db, 'customerchats', chatId, 'chats');
  await addDoc(messagesCol, {
    message: text,
    sentby: senderId,
    receivedby: receivedby || '',
    senderName,
    senderType,
    imageUrl: imageUrl || null,
    timestamp: serverTimestamp(),
    isread: false,
  });

  const chatRef = doc(db, 'customerchats', chatId);
  const chatSnap = await getDoc(chatRef);
  const isAdminSender = senderType === 'admin';
  const currentUnread = chatSnap.exists()
    ? (isAdminSender ? chatSnap.data().unreadVendor || 0 : chatSnap.data().unreadAdmin || 0)
    : 0;

  await updateDoc(chatRef, {
    lastMessage: text,
    lastlyactive: serverTimestamp(),
    lastMessageBy: senderId,
    ...(isAdminSender
      ? { unreadVendor: currentUnread + 1 }
      : { unreadAdmin: currentUnread + 1 }),
  });
}

export async function markVendorMessagesAsRead(chatId: string) {
  try {
    await updateDoc(doc(db, 'customerchats', chatId), { unreadAdmin: 0 });
  } catch {}
}

export async function markVendorUnreadAsRead(chatId: string) {
  try {
    await updateDoc(doc(db, 'customerchats', chatId), { unreadVendor: 0 });
  } catch {}
}

// Create a general support chat for a vendor (when no orderId context)
export async function ensureVendorChat(
  vendorId: string,
  vendorName: string,
  vendorPhone?: string,
  vendorImage?: string
): Promise<string> {
  const q = query(vendorChatsCollection, where('vendorId', '==', vendorId), where('orderId', '==', 'support'));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;
  const ref = await addDoc(vendorChatsCollection, {
    vendorId,
    vendorName: vendorName || '',
    vendorPhone: vendorPhone || '',
    vendorImage: vendorImage || '',
    orderId: 'support',
    lastMessage: '',
    lastlyactive: serverTimestamp(),
    unreadAdmin: 0,
    unreadVendor: 0,
  });
  return ref.id;
}

// Create/ensure a chat for a specific order — used when clicking "Chat" on an order
export async function ensureOrderChat(
  orderId: string,
  vendorId: string,
  vendorName?: string,
  vendorPhone?: string,
  vendorImage?: string
): Promise<string> {
  // Look for existing chat matching this order + vendor
  const q = query(
    customerChatsCollection,
    where('orderId', '==', orderId),
    where('vendorId', '==', vendorId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;

  const ref = await addDoc(customerChatsCollection, {
    orderId,
    vendorId,
    vendorName: vendorName || '',
    vendorPhone: vendorPhone || '',
    vendorImage: vendorImage || '',
    lastMessage: '',
    lastlyactive: serverTimestamp(),
    unreadAdmin: 0,
    unreadVendor: 0,
  });
  return ref.id;
}

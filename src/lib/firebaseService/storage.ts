
'use server';

import { storage } from '@/lib/firebase';
import * as firebaseStorage from 'firebase/storage';
// @ts-ignore
const { ref, uploadString, getDownloadURL, deleteObject } = firebaseStorage;
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(fileDataUrl: string, path: string): Promise<string> {
  if (!fileDataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL');
  }

  const fileExtension = fileDataUrl.substring(fileDataUrl.indexOf('/') + 1, fileDataUrl.indexOf(';'));
  const uniqueFilename = `${uuidv4()}.${fileExtension}`;
  const fullPath = `${path}/${uniqueFilename}`;
  
  const storageRef = ref(storage, fullPath);

  await uploadString(storageRef, fileDataUrl, 'data_url');
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

export async function deleteFile(url: string): Promise<void> {
  if (!url || !url.includes('firebasestorage')) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

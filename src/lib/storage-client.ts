
import { storage } from './firebase';
import * as firebaseStorage from 'firebase/storage';
// @ts-ignore
const { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } = firebaseStorage;
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a File object directly to Firebase Storage.
 * @param file The File object from an input element.
 * @param path The folder path (e.g., 'services/docId').
 * @param customFileName Optional filename to use. If provided, it will overwrite any existing file with the same name.
 */
export async function uploadFileClient(file: File, path: string, customFileName?: string): Promise<string> {
  const fileExtension = file.name.split('.').pop();
  const fileName = customFileName ? `${customFileName}.${fileExtension}` : `${uuidv4()}.${fileExtension}`;
  const fullPath = `${path}/${fileName}`;
  
  const storageRef = ref(storage, fullPath);
  
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      null,
      (error: any) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });
}

/**
 * Deletes a file from Firebase Storage given its download URL.
 */
export async function deleteFileClient(url: string): Promise<void> {
  if (!url || !url.includes('firebasestorage')) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

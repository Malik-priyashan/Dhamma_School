const DATABASE_NAME = 'dhamma-school-form-draft';
const STORE_NAME = 'files';
const IMAGE_KEY = 'studentForm:v1:studentImage';

let cachedImage: File | null | undefined;
let pendingWrite: Promise<void> = Promise.resolve();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredImage(): Promise<File | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(IMAGE_KEY);
    request.onsuccess = () => resolve(request.result instanceof File ? request.result : null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
  });
}

function writeStoredImage(image: File | null): Promise<void> {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    if (image) store.put(image, IMAGE_KEY);
    else store.delete(IMAGE_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  }));
}

export async function loadDraftStudentImage(): Promise<File | null> {
  await pendingWrite.catch(() => {});
  if (cachedImage !== undefined) return cachedImage;
  const storedImage = await readStoredImage();
  if (cachedImage === undefined) cachedImage = storedImage;
  return cachedImage;
}

export function saveDraftStudentImage(image: File | null): Promise<void> {
  if (cachedImage === image) return pendingWrite;
  cachedImage = image;
  pendingWrite = pendingWrite.catch(() => {}).then(() => writeStoredImage(image));
  return pendingWrite;
}

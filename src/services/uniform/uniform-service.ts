import { db, storage } from '@/services/firebase/config';
import type { UniformCategory, UniformLayer, UniformLibraryImage } from '@/types/uniform';
import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, writeBatch, type WriteBatch } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const ROOT = 'uniforms/miguel';
const libraryRef = () => collection(db!, ROOT, 'library');
const layersRef = () => collection(db!, ROOT, 'layers');
const categoriesRef = () => collection(db!, ROOT, 'categories');

function requireFirebase() {
  if (!db || !storage) throw new Error('Firebase não está configurado para o gerenciador de uniforme.');
}

export async function getUniformLibrary(): Promise<UniformLibraryImage[]> {
  requireFirebase();
  const snapshot = await getDocs(query(libraryRef(), orderBy('name')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as UniformLibraryImage);
}

export async function getUniformLayers(): Promise<UniformLayer[]> {
  requireFirebase();
  const snapshot = await getDocs(query(layersRef(), orderBy('order')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as UniformLayer);
}

export async function getUniformCategories(): Promise<UniformCategory[]> {
  requireFirebase();
  const snapshot = await getDocs(query(categoriesRef(), orderBy('name')));
  return snapshot.docs.map((item) => String(item.data().name));
}

export async function saveUniformCategory(name: string) {
  requireFirebase();
  const normalized = name.trim();
  if (!normalized) throw new Error('Informe o nome da categoria.');
  await setDoc(doc(categoriesRef(), normalized.toLocaleLowerCase().replace(/[^a-z0-9]+/gi, '-')), { name: normalized, updatedAt: serverTimestamp() });
}

export async function uploadUniformImage(file: Blob, fileName: string, mimeType: string, metadata: Pick<UniformLibraryImage, 'name' | 'description' | 'category' | 'createdBy'>, onProgress?: (progress: number) => void) {
  requireFirebase();
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) throw new Error('Envie uma imagem PNG, WEBP ou JPG.');
  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error('A imagem excede o tamanho máximo configurado de 8 MB.');
  const imageDoc = doc(libraryRef());
  const extension = fileName.split('.').pop()?.toLowerCase() || 'png';
  const storagePath = `uniforms/emblems/${imageDoc.id}.${extension}`;
  const task = uploadBytesResumable(ref(storage!, storagePath), file, { contentType: mimeType });
  await new Promise<void>((resolve, reject) => task.on('state_changed', (snapshot) => onProgress?.(snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0), reject, () => resolve()));
  const downloadUrl = await getDownloadURL(task.snapshot.ref);
  await setDoc(imageDoc, { ...metadata, storagePath, downloadUrl, mimeType, createdAt: serverTimestamp() });
  return imageDoc.id;
}

export async function saveUniformLayers(layers: UniformLayer[], uid: string) {
  requireFirebase();
  // Firestore batches top out at 500 writes. Chunk dynamically instead of imposing a
  // product limit on layers, and remove only records absent from this saved draft.
  const existing = await getDocs(layersRef());
  const incoming = new Set(layers.map((layer) => layer.id));
  const operations: Array<(batch: WriteBatch) => void> = [
    ...layers.map(({ id, ...layer }) => (batch: WriteBatch) => batch.set(doc(layersRef(), id), { ...layer, updatedBy: uid, updatedAt: serverTimestamp() }, { merge: true })),
    ...existing.docs.filter((item) => !incoming.has(item.id)).map((item) => (batch: WriteBatch) => batch.delete(item.ref)),
  ];
  for (let index = 0; index < operations.length; index += 450) {
    const batch = writeBatch(db!);
    operations.slice(index, index + 450).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

export async function deleteUniformLayer(id: string) { requireFirebase(); await deleteDoc(doc(layersRef(), id)); }
export async function deleteUniformImage(image: UniformLibraryImage) {
  requireFirebase();
  await Promise.all([deleteDoc(doc(libraryRef(), image.id)), deleteObject(ref(storage!, image.storagePath))]);
}
export async function renameUniformImage(id: string, name: string) { requireFirebase(); await updateDoc(doc(libraryRef(), id), { name: name.trim(), updatedAt: serverTimestamp() }); }

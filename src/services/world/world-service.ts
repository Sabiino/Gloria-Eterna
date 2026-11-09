import { auth, db } from '@/services/firebase/config';
import type { Camp, WorldCoordinate } from '@/types/game';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export function subscribeToSectorCamps(sectorId: string, onChange: (camps: Camp[]) => void, onError?: (error: Error) => void) {
  if (!db) return () => undefined;
  return onSnapshot(query(collection(db, 'camps'), where('sectorId', '==', sectorId)), snap => onChange(snap.docs.map(item => ({ id: item.id, ...item.data() }) as Camp)), error => onError?.(error));
}
export async function claimCampPlot(name: string, position: WorldCoordinate) {
  if (!auth?.currentUser || !db) throw new Error('Entre novamente para escolher seu terreno.');
  const fn = httpsCallable(getFunctions(), 'claimCampPlot');
  await fn({ name, islandId: 'ilha-vale-01', sectorId: 'vale-recomeco-01', gridX: position.x, gridY: position.y });
}
export async function saveAvatarPosition(position: WorldCoordinate) {
  if (!auth?.currentUser || !db) return;
  const fn = httpsCallable(getFunctions(), 'saveAvatarPosition');
  await fn({ islandId: 'ilha-vale-01', sectorId: 'vale-recomeco-01', gridX: position.x, gridY: position.y });
}

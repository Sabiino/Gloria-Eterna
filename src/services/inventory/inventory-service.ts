import { db } from '@/services/firebase/config';
import type { Inventory } from '@/types/game';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { inventoryCatalog, type InventoryItemId } from '@/config/inventory-catalog';
import { canAddItem } from './inventory-utils';

const callable = (name: string) => httpsCallable(getFunctions(), name);
const asIso = (value: unknown) => {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate().toISOString();
  return typeof value === 'string' ? value : undefined;
};

export async function getInventory(uid: string): Promise<Inventory | null> {
  if (!db) return null;
  const snapshot = await getDoc(doc(db, 'inventories', uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return { ownerId: data.ownerId, backpackLevel: data.backpackLevel, capacity: data.capacity, slots: data.slots ?? [], keyItems: data.keyItems ?? [], upgradeStatus: data.upgradeStatus ?? 'idle', upgradeStartedAt: asIso(data.upgradeStartedAt), upgradeEndsAt: asIso(data.upgradeEndsAt), updatedAt: asIso(data.updatedAt), pendingRewards: data.pendingRewards ?? [], processedRewardIds: data.processedRewardIds ?? [] };
}

export async function initializeInventory(): Promise<void> { await callable('initializeInventory')({}); }
export async function startBackpackUpgrade(): Promise<void> { await callable('startBackpackUpgrade')({}); }
export async function completeBackpackUpgrade(): Promise<void> { await callable('completeBackpackUpgrade')({}); }
export const getBackpackLevel = (inventory: Inventory | null) => inventory?.backpackLevel ?? 1;
export const getBackpackCapacity = (inventory: Inventory | null) => inventory?.capacity ?? 12;
/**
 * Read-only capacity check for UI feedback. Actual grants stay server-authoritative
 * and are processed by trusted activities, never by a client supplied quantity.
 */
export const canReceiveItems = (inventory: Inventory | null, itemId: InventoryItemId, quantity: number) =>
  Boolean(inventory && canAddItem(inventory.slots, inventory.capacity, itemId, quantity));
export const getItemDetails = (itemId: string) => inventoryCatalog[itemId as InventoryItemId] ?? null;

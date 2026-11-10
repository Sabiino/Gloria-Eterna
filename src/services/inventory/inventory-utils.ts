import { inventoryCatalog, type InventoryItemId } from '../../config/inventory-catalog';
import type { InventorySlot } from '../../types/game';

export const calculateUsedSlots = (slots: readonly InventorySlot[]) => slots.length;
export const calculateFreeSlots = (slots: readonly InventorySlot[], capacity: number) => Math.max(0, capacity - calculateUsedSlots(slots));

export function normalizeInventoryStacks(slots: readonly InventorySlot[]): InventorySlot[] {
  const normalized: InventorySlot[] = [];
  for (const slot of slots) {
    const item = inventoryCatalog[slot.itemId as InventoryItemId];
    if (!item || slot.quantity <= 0 || item.isKeyItem) continue;
    let remaining = slot.quantity;
    if (!item.isStackable) { normalized.push({ ...slot, quantity: 1 }); continue; }
    while (remaining > 0) { const quantity = Math.min(item.maxStack, remaining); normalized.push({ slotId: `slot-${String(normalized.length + 1).padStart(2, '0')}`, itemId: slot.itemId, quantity }); remaining -= quantity; }
  }
  return normalized;
}

export function canAddItem(slots: readonly InventorySlot[], capacity: number, itemId: InventoryItemId, quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) return false;
  const item = inventoryCatalog[itemId];
  if (item.isKeyItem) return true;
  let remaining = quantity;
  if (item.isStackable) for (const slot of slots) if (slot.itemId === itemId) remaining -= Math.max(0, item.maxStack - slot.quantity);
  return Math.max(0, Math.ceil(remaining / item.maxStack)) <= calculateFreeSlots(slots, capacity);
}

export function addItemToInventory(slots: readonly InventorySlot[], capacity: number, itemId: InventoryItemId, quantity: number) {
  if (!canAddItem(slots, capacity, itemId, quantity)) return { slots: [...slots], added: 0, remaining: quantity };
  const item = inventoryCatalog[itemId]; const next = slots.map(slot => ({ ...slot })); let remaining = quantity;
  if (item.isStackable) for (const slot of next) if (slot.itemId === itemId && slot.quantity < item.maxStack) { const add = Math.min(remaining, item.maxStack - slot.quantity); slot.quantity += add; remaining -= add; }
  while (remaining > 0) { const add = Math.min(remaining, item.maxStack); next.push({ slotId: `slot-${String(next.length + 1).padStart(2, '0')}`, itemId, quantity: add }); remaining -= add; }
  return { slots: next, added: quantity, remaining: 0 };
}

export function removeItemFromInventory(slots: readonly InventorySlot[], itemId: InventoryItemId, quantity: number) {
  const total = slots.filter(slot => slot.itemId === itemId).reduce((sum, slot) => sum + slot.quantity, 0);
  if (!Number.isInteger(quantity) || quantity <= 0 || total < quantity) return { slots: [...slots], removed: 0 };
  let remaining = quantity; const next: InventorySlot[] = [];
  for (const slot of slots) { if (slot.itemId !== itemId || remaining === 0) next.push({ ...slot }); else { const take = Math.min(remaining, slot.quantity); remaining -= take; if (slot.quantity > take) next.push({ ...slot, quantity: slot.quantity - take }); } }
  return { slots: next.map((slot, index) => ({ ...slot, slotId: `slot-${String(index + 1).padStart(2, '0')}` })), removed: quantity };
}

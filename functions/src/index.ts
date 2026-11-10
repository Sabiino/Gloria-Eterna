import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

admin.initializeApp();
const localOrigins = [/^http:\/\/localhost:\d+$/];
const db = admin.firestore();
const initialSlots = [
  { slotId: 'slot-01', itemId: 'wood', quantity: 40 }, { slotId: 'slot-02', itemId: 'stone', quantity: 15 }, { slotId: 'slot-03', itemId: 'natural_fiber', quantity: 10 },
  { slotId: 'slot-04', itemId: 'canteen', quantity: 1 }, { slotId: 'slot-05', itemId: 'rope', quantity: 1 }, { slotId: 'slot-06', itemId: 'flashlight', quantity: 1 }, { slotId: 'slot-07', itemId: 'basic_tools', quantity: 1 },
];
const initialKeyItems = ['bible', 'compass'];
const itemRules = {
  wood: { maxStack: 100, stackable: true, keyItem: false, consumable: false },
  stone: { maxStack: 100, stackable: true, keyItem: false, consumable: false },
  natural_fiber: { maxStack: 100, stackable: true, keyItem: false, consumable: false },
  canteen: { maxStack: 1, stackable: false, keyItem: false, consumable: false },
  rope: { maxStack: 1, stackable: false, keyItem: false, consumable: false },
  flashlight: { maxStack: 1, stackable: false, keyItem: false, consumable: false },
  basic_tools: { maxStack: 1, stackable: false, keyItem: false, consumable: false },
  bible: { maxStack: 1, stackable: false, keyItem: true, consumable: false },
  compass: { maxStack: 1, stackable: false, keyItem: true, consumable: false },
} as const;
const validItemIds = new Set(Object.keys(itemRules));
const upgradeOne = { from: 1, to: 2, capacity: 16, tentLevel: 2, coins: 25, wood: 60, naturalFiber: 20, durationMs: 180_000 };

type Slot = { slotId: string; itemId: string; quantity: number };
type PendingReward = { id: string; itemId: string; quantity: number };
type InventoryData = { ownerId: string; backpackLevel: number; capacity: number; slots: Slot[]; keyItems: string[]; pendingRewards?: PendingReward[]; processedRewardIds?: string[]; upgradeStatus: 'idle' | 'upgrading' | 'ready'; upgradeStartedAt?: admin.firestore.Timestamp; upgradeEndsAt?: admin.firestore.Timestamp };
type ItemGrant = { itemId: string; quantity: number };
const initialInventory = (uid: string): InventoryData => ({ ownerId: uid, backpackLevel: 1, capacity: 12, slots: initialSlots.map(slot => ({ ...slot })), keyItems: [...initialKeyItems], pendingRewards: [], processedRewardIds: [], upgradeStatus: 'idle' });
const quantityOf = (slots: Slot[], itemId: string) => slots.filter(slot => slot.itemId === itemId).reduce((sum, slot) => sum + slot.quantity, 0);
const consume = (slots: Slot[], itemId: string, quantity: number) => {
  let remaining = quantity;
  const result: Slot[] = [];
  for (const slot of slots) {
    if (slot.itemId !== itemId || remaining === 0) result.push({ ...slot });
    else {
      const used = Math.min(slot.quantity, remaining);
      remaining -= used;
      if (slot.quantity > used) result.push({ ...slot, quantity: slot.quantity - used });
    }
  }
  if (remaining !== 0) throw new HttpsError('failed-precondition', 'Recursos insuficientes.');
  return result.map((slot, index) => ({ ...slot, slotId: `slot-${String(index + 1).padStart(2, '0')}` }));
};

const validateGrant = ({ itemId, quantity }: ItemGrant) => {
  if (!validItemIds.has(itemId) || !Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new HttpsError('invalid-argument', 'Item ou quantidade inválidos.');
  }
};

const add = (slots: Slot[], capacity: number, itemId: string, quantity: number) => {
  validateGrant({ itemId, quantity });
  const rule = itemRules[itemId as keyof typeof itemRules];
  if (rule.keyItem) return { slots: slots.map(slot => ({ ...slot })), keyItem: itemId };
  const next = slots.map(slot => ({ ...slot }));
  let remaining = quantity;
  if (rule.stackable) {
    for (const slot of next) {
      if (slot.itemId !== itemId || slot.quantity >= rule.maxStack || remaining === 0) continue;
      const inserted = Math.min(remaining, rule.maxStack - slot.quantity);
      slot.quantity += inserted;
      remaining -= inserted;
    }
  }
  const slotsNeeded = rule.stackable ? Math.ceil(remaining / rule.maxStack) : remaining;
  if (next.length + slotsNeeded > capacity) return null;
  while (remaining > 0) {
    const inserted = Math.min(remaining, rule.maxStack);
    next.push({ slotId: `slot-${String(next.length + 1).padStart(2, '0')}`, itemId, quantity: inserted });
    remaining -= inserted;
  }
  return { slots: next, keyItem: undefined };
};

/**
 * Server-only reward operation. Future missions and activities must call this helper
 * from trusted backend code; it is deliberately not exposed as a client-callable API.
 */
export async function grantItems(uid: string, grants: readonly ItemGrant[], rewardId: string) {
  if (!uid || !rewardId || grants.length === 0) throw new HttpsError('invalid-argument', 'Recompensa inválida.');
  for (const grant of grants) validateGrant(grant);
  await db.runTransaction(async tx => {
    const { ref, inventory } = await getOrCreateInventory(tx, uid);
    if ((inventory.processedRewardIds ?? []).includes(rewardId)) return;
    let slots = inventory.slots;
    const keyItems = [...inventory.keyItems];
    const pending = [...(inventory.pendingRewards ?? [])];
    for (const grant of grants) {
      const result = add(slots, inventory.capacity, grant.itemId, grant.quantity);
      if (!result) {
        pending.push({ id: `${rewardId}:${grant.itemId}`, ...grant });
        continue;
      }
      slots = result.slots;
      if (result.keyItem && !keyItems.includes(result.keyItem)) keyItems.push(result.keyItem);
    }
    tx.update(ref, { slots, keyItems, pendingRewards: pending, processedRewardIds: [...(inventory.processedRewardIds ?? []), rewardId].slice(-100), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  });
}

/** Server-only pending-reward redemption. It preserves rewards that still do not fit. */
export async function claimPendingRewards(uid: string) {
  await db.runTransaction(async tx => {
    const { ref, inventory } = await getOrCreateInventory(tx, uid);
    let slots = inventory.slots;
    const keyItems = [...inventory.keyItems];
    const remaining: PendingReward[] = [];
    for (const reward of inventory.pendingRewards ?? []) {
      const result = add(slots, inventory.capacity, reward.itemId, reward.quantity);
      if (!result) {
        remaining.push(reward);
        continue;
      }
      slots = result.slots;
      if (result.keyItem && !keyItems.includes(result.keyItem)) keyItems.push(result.keyItem);
    }
    tx.update(ref, { slots, keyItems, pendingRewards: remaining, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  });
}

/** Server-only consumption helper. Client UI never controls quantities directly. */
export async function consumeItems(uid: string, itemId: string, quantity: number) {
  validateGrant({ itemId, quantity });
  await db.runTransaction(async tx => {
    const { ref, inventory } = await getOrCreateInventory(tx, uid);
    if (itemRules[itemId as keyof typeof itemRules].keyItem) throw new HttpsError('failed-precondition', 'Itens especiais não podem ser consumidos.');
    tx.update(ref, { slots: consume(inventory.slots, itemId, quantity), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  });
}
const inventoryRef = (uid: string) => db.doc(`inventories/${uid}`);

async function getOrCreateInventory(tx: admin.firestore.Transaction, uid: string) {
  const ref = inventoryRef(uid);
  const snapshot = await tx.get(ref);
  if (snapshot.exists) return { ref, inventory: snapshot.data() as InventoryData };
  const inventory = initialInventory(uid);
  tx.create(ref, { ...inventory, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { ref, inventory };
}

export const initializePlayer = onCall({ cors: localOrigins }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  const { nickname, fullName, birthDate, avatarId, campName } = request.data as Record<string, string>;
  if (!nickname || !fullName || !birthDate || !avatarId || !campName) throw new HttpsError('invalid-argument', 'Dados de perfil incompletos.');
  const uid = request.auth.uid;
  await db.runTransaction(async tx => {
    const playerRef = db.doc(`players/${uid}`), usernameRef = db.doc(`usernames/${nickname.trim().toLowerCase()}`);
    const existing = await tx.get(playerRef);
    if (existing.exists && existing.data()?.profileCompleted) { await getOrCreateInventory(tx, uid); return; }
    const reservedName = await tx.get(usernameRef);
    if (reservedName.exists && reservedName.data()?.uid !== uid) throw new HttpsError('already-exists', 'Este apelido já está em uso.');
    tx.set(usernameRef, { uid });
    tx.set(playerRef, { uid, nickname: nickname.trim(), avatarId, campName: campName.trim(), profileCompleted: true, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    tx.set(db.doc(`users/${uid}/private/profile`), { fullName, birthDate, email: request.auth?.token.email ?? '' }, { merge: true });
    tx.set(db.doc(`gameStates/${uid}`), { playerId: uid, playerLevel: 1, playerXp: 0, league: 'aspirante', coins: 100, tentLevel: 1, backpackLevel: 1, campId: '', worldSectorId: 'vale-recomeco-01' }, { merge: true });
    await getOrCreateInventory(tx, uid);
  });
  return { ok: true };
});

/** Idempotent repair path for accounts created before the inventory system. */
export const initializeInventory = onCall({ cors: localOrigins }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  const result = await db.runTransaction(async tx => getOrCreateInventory(tx, request.auth!.uid));
  return { ok: true, inventory: result.inventory };
});

export const startBackpackUpgrade = onCall({ cors: localOrigins }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  const uid = request.auth.uid;
  await db.runTransaction(async tx => {
    const { ref, inventory } = await getOrCreateInventory(tx, uid);
    const stateRef = db.doc(`gameStates/${uid}`);
    const state = await tx.get(stateRef);
    if (inventory.backpackLevel !== upgradeOne.from) throw new HttpsError('failed-precondition', 'A próxima melhoria ainda não está disponível.');
    if (inventory.upgradeStatus === 'upgrading') throw new HttpsError('already-exists', 'A mochila já está em melhoria.');
    const game = state.data() ?? {};
    if ((game.tentLevel ?? 1) < upgradeOne.tentLevel) throw new HttpsError('failed-precondition', 'A Barraca Central precisa estar no nível 2.');
    if ((game.coins ?? 0) < upgradeOne.coins) throw new HttpsError('failed-precondition', 'Moedas insuficientes.');
    if (quantityOf(inventory.slots, 'wood') < upgradeOne.wood || quantityOf(inventory.slots, 'natural_fiber') < upgradeOne.naturalFiber) throw new HttpsError('failed-precondition', 'Materiais insuficientes para a melhoria.');
    const slots = consume(consume(inventory.slots, 'wood', upgradeOne.wood), 'natural_fiber', upgradeOne.naturalFiber);
    const now = admin.firestore.Timestamp.now();
    tx.update(ref, { slots, upgradeStatus: 'upgrading', upgradeStartedAt: now, upgradeEndsAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + upgradeOne.durationMs), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    tx.set(stateRef, { coins: game.coins - upgradeOne.coins }, { merge: true });
  });
  return { ok: true };
});

export const completeBackpackUpgrade = onCall({ cors: localOrigins }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  await db.runTransaction(async tx => {
    const { ref, inventory } = await getOrCreateInventory(tx, request.auth!.uid);
    if (inventory.upgradeStatus !== 'upgrading' || !inventory.upgradeEndsAt) throw new HttpsError('failed-precondition', 'Nenhuma melhoria para concluir.');
    if (inventory.upgradeEndsAt.toMillis() > Date.now()) throw new HttpsError('failed-precondition', 'A melhoria ainda não foi concluída.');
    tx.update(ref, { backpackLevel: upgradeOne.to, capacity: upgradeOne.capacity, upgradeStatus: 'idle', upgradeStartedAt: admin.firestore.FieldValue.delete(), upgradeEndsAt: admin.firestore.FieldValue.delete(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    tx.set(db.doc(`gameStates/${request.auth!.uid}`), { backpackLevel: upgradeOne.to }, { merge: true });
  });
  return { ok: true };
});

const introductionAnswers: Record<string, string> = { age: 'b', bases: 'a', mission: 'c', attitude: 'd', areas: 'a' };
export const submitAdventurerIntroductionQuiz = onCall({ cors: localOrigins }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  const { answers, attemptId } = request.data as { answers?: Record<string, string>; attemptId?: string };
  if (!answers || typeof attemptId !== 'string' || attemptId.length < 8) throw new HttpsError('invalid-argument', 'Tentativa inválida.');
  const ids = Object.keys(introductionAnswers);
  if (ids.some(id => typeof answers[id] !== 'string')) throw new HttpsError('invalid-argument', 'Responda todas as perguntas.');
  const score = ids.reduce((total, id) => total + Number(answers[id] === introductionAnswers[id]), 0);
  const passed = score >= 3, uid = request.auth.uid, ref = db.doc(`users/${uid}/career/adventurerAdmission`);
  const result = await db.runTransaction(async tx => {
    const existing = await tx.get(ref); const current = existing.data()?.objectives?.introduction ?? {};
    if ((current.attemptIds ?? []).includes(attemptId)) return { score: current.lastScore ?? score, passed: !!current.completed, duplicate: true };
    const completed = !!current.completed || passed;
    tx.set(ref, { objectives: { introduction: { completed, bestScore: Math.max(current.bestScore ?? 0, score), lastScore: score, totalQuestions: 5, attempts: (current.attempts ?? 0) + 1, attemptIds: [...(current.attemptIds ?? []), attemptId].slice(-30), completedAt: current.completedAt ?? (passed ? admin.firestore.FieldValue.serverTimestamp() : null), contentVersion: 'adventurer-introduction-v1' } }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { score, passed, duplicate: false };
  });
  return result;
});

const SIZE = 256;
const land = (x: number, y: number) => { const dx = (x - 127.5) / 117, dy = (y - 127.5) / 117; return x >= 3 && y >= 3 && x < SIZE - 3 && y < SIZE - 3 && Math.hypot(dx, dy) < .95 && Math.abs(x - (127 + 18 * Math.sin((y + 207) / 33))) > 5; };
const validGrid = (x: unknown, y: unknown) => Number.isInteger(x) && Number.isInteger(y) && land(Number(x), Number(y));
export const claimCampPlot = onCall({ cors: localOrigins }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  const { name, islandId, sectorId, gridX, gridY } = request.data as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 40 || typeof islandId !== 'string' || typeof sectorId !== 'string' || !validGrid(gridX, gridY)) throw new HttpsError('invalid-argument', 'Terreno ou nome inválido.');
  const uid = request.auth.uid, campRef = db.doc(`camps/camp_${uid}`), stateRef = db.doc(`gameStates/${uid}`), x = Number(gridX), y = Number(gridY);
  await db.runTransaction(async tx => {
    const existing = await tx.get(campRef); if (existing.exists) return;
    const cells: admin.firestore.DocumentReference[] = []; for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) { const cx = x + ox, cy = y + oy; if (!validGrid(cx, cy)) throw new HttpsError('failed-precondition', 'A barraca precisa ficar em solo livre.'); cells.push(db.doc(`worldOccupancy/${islandId}_${sectorId}_${cx}_${cy}`)); }
    const occupied = await Promise.all(cells.map(cell => tx.get(cell))); if (occupied.some(item => item.exists)) throw new HttpsError('already-exists', 'Esse terreno acabou de ser reservado por outro aventureiro.');
    for (const cell of cells) tx.create(cell, { ownerId: uid, campId: campRef.id, islandId, sectorId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    const player = await tx.get(db.doc(`players/${uid}`));
    tx.create(campRef, { id: campRef.id, ownerId: uid, name: name.trim(), ownerNickname: player.data()?.nickname ?? 'Aventureiro', islandId, sectorId, gridX: x, gridY: y, tentLevel: 1, width: 5, height: 5, positionStatus: 'placed', createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    tx.set(stateRef, { campId: campRef.id, worldSectorId: sectorId, avatarPosition: { islandId, sectorId, gridX: x + 2, gridY: y + 2 } }, { merge: true });
  });
  return { ok: true, campId: campRef.id };
});
export const saveAvatarPosition = onCall({ cors: localOrigins }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  const { islandId, sectorId, gridX, gridY } = request.data as Record<string, unknown>;
  if (typeof islandId !== 'string' || typeof sectorId !== 'string' || !validGrid(gridX, gridY)) throw new HttpsError('invalid-argument', 'Posição inválida.');
  await db.doc(`gameStates/${request.auth.uid}`).set({ avatarPosition: { islandId, sectorId, gridX, gridY }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { ok: true };
});

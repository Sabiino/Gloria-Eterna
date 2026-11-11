"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAvatarPosition = exports.claimCampPlot = exports.submitAdventurerIntroductionQuiz = exports.completeBackpackUpgrade = exports.startBackpackUpgrade = exports.initializeInventory = exports.initializePlayer = exports.grantConfiguredAdmin = void 0;
exports.grantItems = grantItems;
exports.claimPendingRewards = claimPendingRewards;
exports.consumeItems = consumeItems;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
const localOrigins = [/^http:\/\/localhost:\d+$/];
const db = admin.firestore();
// One-off operational endpoint. It is deliberately restricted to the UID supplied
// by the project owner and is removed immediately after the claim is provisioned.
exports.grantConfiguredAdmin = (0, https_1.onRequest)(async (_request, response) => {
    const uid = 'wwv5MkWYCgTjYFKv1UkzX8C8yma2';
    const user = await admin.auth().getUser(uid);
    await admin.auth().setCustomUserClaims(uid, { ...(user.customClaims ?? {}), admin: true });
    response.status(200).json({ ok: true, uid, email: user.email ?? null, admin: true });
});
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
};
const validItemIds = new Set(Object.keys(itemRules));
const upgradeOne = { from: 1, to: 2, capacity: 16, tentLevel: 2, coins: 25, wood: 60, naturalFiber: 20, durationMs: 180_000 };
const initialInventory = (uid) => ({ ownerId: uid, backpackLevel: 1, capacity: 12, slots: initialSlots.map(slot => ({ ...slot })), keyItems: [...initialKeyItems], pendingRewards: [], processedRewardIds: [], upgradeStatus: 'idle' });
const quantityOf = (slots, itemId) => slots.filter(slot => slot.itemId === itemId).reduce((sum, slot) => sum + slot.quantity, 0);
const consume = (slots, itemId, quantity) => {
    let remaining = quantity;
    const result = [];
    for (const slot of slots) {
        if (slot.itemId !== itemId || remaining === 0)
            result.push({ ...slot });
        else {
            const used = Math.min(slot.quantity, remaining);
            remaining -= used;
            if (slot.quantity > used)
                result.push({ ...slot, quantity: slot.quantity - used });
        }
    }
    if (remaining !== 0)
        throw new https_1.HttpsError('failed-precondition', 'Recursos insuficientes.');
    return result.map((slot, index) => ({ ...slot, slotId: `slot-${String(index + 1).padStart(2, '0')}` }));
};
const validateGrant = ({ itemId, quantity }) => {
    if (!validItemIds.has(itemId) || !Number.isSafeInteger(quantity) || quantity <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'Item ou quantidade inválidos.');
    }
};
const add = (slots, capacity, itemId, quantity) => {
    validateGrant({ itemId, quantity });
    const rule = itemRules[itemId];
    if (rule.keyItem)
        return { slots: slots.map(slot => ({ ...slot })), keyItem: itemId };
    const next = slots.map(slot => ({ ...slot }));
    let remaining = quantity;
    if (rule.stackable) {
        for (const slot of next) {
            if (slot.itemId !== itemId || slot.quantity >= rule.maxStack || remaining === 0)
                continue;
            const inserted = Math.min(remaining, rule.maxStack - slot.quantity);
            slot.quantity += inserted;
            remaining -= inserted;
        }
    }
    const slotsNeeded = rule.stackable ? Math.ceil(remaining / rule.maxStack) : remaining;
    if (next.length + slotsNeeded > capacity)
        return null;
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
async function grantItems(uid, grants, rewardId) {
    if (!uid || !rewardId || grants.length === 0)
        throw new https_1.HttpsError('invalid-argument', 'Recompensa inválida.');
    for (const grant of grants)
        validateGrant(grant);
    await db.runTransaction(async (tx) => {
        const { ref, inventory } = await getOrCreateInventory(tx, uid);
        if ((inventory.processedRewardIds ?? []).includes(rewardId))
            return;
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
            if (result.keyItem && !keyItems.includes(result.keyItem))
                keyItems.push(result.keyItem);
        }
        tx.update(ref, { slots, keyItems, pendingRewards: pending, processedRewardIds: [...(inventory.processedRewardIds ?? []), rewardId].slice(-100), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
}
/** Server-only pending-reward redemption. It preserves rewards that still do not fit. */
async function claimPendingRewards(uid) {
    await db.runTransaction(async (tx) => {
        const { ref, inventory } = await getOrCreateInventory(tx, uid);
        let slots = inventory.slots;
        const keyItems = [...inventory.keyItems];
        const remaining = [];
        for (const reward of inventory.pendingRewards ?? []) {
            const result = add(slots, inventory.capacity, reward.itemId, reward.quantity);
            if (!result) {
                remaining.push(reward);
                continue;
            }
            slots = result.slots;
            if (result.keyItem && !keyItems.includes(result.keyItem))
                keyItems.push(result.keyItem);
        }
        tx.update(ref, { slots, keyItems, pendingRewards: remaining, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
}
/** Server-only consumption helper. Client UI never controls quantities directly. */
async function consumeItems(uid, itemId, quantity) {
    validateGrant({ itemId, quantity });
    await db.runTransaction(async (tx) => {
        const { ref, inventory } = await getOrCreateInventory(tx, uid);
        if (itemRules[itemId].keyItem)
            throw new https_1.HttpsError('failed-precondition', 'Itens especiais não podem ser consumidos.');
        tx.update(ref, { slots: consume(inventory.slots, itemId, quantity), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
}
const inventoryRef = (uid) => db.doc(`inventories/${uid}`);
async function getOrCreateInventory(tx, uid) {
    const ref = inventoryRef(uid);
    const snapshot = await tx.get(ref);
    if (snapshot.exists)
        return { ref, inventory: snapshot.data() };
    const inventory = initialInventory(uid);
    tx.create(ref, { ...inventory, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { ref, inventory };
}
exports.initializePlayer = (0, https_1.onCall)({ cors: localOrigins }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Autenticação necessária.');
    const { nickname, fullName, birthDate, avatarId, campName } = request.data;
    if (!nickname || !fullName || !birthDate || !avatarId || !campName)
        throw new https_1.HttpsError('invalid-argument', 'Dados de perfil incompletos.');
    const uid = request.auth.uid;
    await db.runTransaction(async (tx) => {
        const playerRef = db.doc(`players/${uid}`), usernameRef = db.doc(`usernames/${nickname.trim().toLowerCase()}`);
        const existing = await tx.get(playerRef);
        if (existing.exists && existing.data()?.profileCompleted) {
            await getOrCreateInventory(tx, uid);
            return;
        }
        const reservedName = await tx.get(usernameRef);
        if (reservedName.exists && reservedName.data()?.uid !== uid)
            throw new https_1.HttpsError('already-exists', 'Este apelido já está em uso.');
        tx.set(usernameRef, { uid });
        tx.set(playerRef, { uid, nickname: nickname.trim(), avatarId, campName: campName.trim(), profileCompleted: true, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        tx.set(db.doc(`users/${uid}/private/profile`), { fullName, birthDate, email: request.auth?.token.email ?? '' }, { merge: true });
        tx.set(db.doc(`gameStates/${uid}`), { playerId: uid, playerLevel: 1, playerXp: 0, league: 'aspirante', coins: 100, tentLevel: 1, backpackLevel: 1, campId: '', worldSectorId: 'vale-recomeco-01' }, { merge: true });
        await getOrCreateInventory(tx, uid);
    });
    return { ok: true };
});
/** Idempotent repair path for accounts created before the inventory system. */
exports.initializeInventory = (0, https_1.onCall)({ cors: localOrigins }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Autenticação necessária.');
    const result = await db.runTransaction(async (tx) => getOrCreateInventory(tx, request.auth.uid));
    return { ok: true, inventory: result.inventory };
});
exports.startBackpackUpgrade = (0, https_1.onCall)({ cors: localOrigins }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Autenticação necessária.');
    const uid = request.auth.uid;
    await db.runTransaction(async (tx) => {
        const { ref, inventory } = await getOrCreateInventory(tx, uid);
        const stateRef = db.doc(`gameStates/${uid}`);
        const state = await tx.get(stateRef);
        if (inventory.backpackLevel !== upgradeOne.from)
            throw new https_1.HttpsError('failed-precondition', 'A próxima melhoria ainda não está disponível.');
        if (inventory.upgradeStatus === 'upgrading')
            throw new https_1.HttpsError('already-exists', 'A mochila já está em melhoria.');
        const game = state.data() ?? {};
        if ((game.tentLevel ?? 1) < upgradeOne.tentLevel)
            throw new https_1.HttpsError('failed-precondition', 'A Barraca Central precisa estar no nível 2.');
        if ((game.coins ?? 0) < upgradeOne.coins)
            throw new https_1.HttpsError('failed-precondition', 'Moedas insuficientes.');
        if (quantityOf(inventory.slots, 'wood') < upgradeOne.wood || quantityOf(inventory.slots, 'natural_fiber') < upgradeOne.naturalFiber)
            throw new https_1.HttpsError('failed-precondition', 'Materiais insuficientes para a melhoria.');
        const slots = consume(consume(inventory.slots, 'wood', upgradeOne.wood), 'natural_fiber', upgradeOne.naturalFiber);
        const now = admin.firestore.Timestamp.now();
        tx.update(ref, { slots, upgradeStatus: 'upgrading', upgradeStartedAt: now, upgradeEndsAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + upgradeOne.durationMs), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        tx.set(stateRef, { coins: game.coins - upgradeOne.coins }, { merge: true });
    });
    return { ok: true };
});
exports.completeBackpackUpgrade = (0, https_1.onCall)({ cors: localOrigins }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Autenticação necessária.');
    await db.runTransaction(async (tx) => {
        const { ref, inventory } = await getOrCreateInventory(tx, request.auth.uid);
        if (inventory.upgradeStatus !== 'upgrading' || !inventory.upgradeEndsAt)
            throw new https_1.HttpsError('failed-precondition', 'Nenhuma melhoria para concluir.');
        if (inventory.upgradeEndsAt.toMillis() > Date.now())
            throw new https_1.HttpsError('failed-precondition', 'A melhoria ainda não foi concluída.');
        tx.update(ref, { backpackLevel: upgradeOne.to, capacity: upgradeOne.capacity, upgradeStatus: 'idle', upgradeStartedAt: admin.firestore.FieldValue.delete(), upgradeEndsAt: admin.firestore.FieldValue.delete(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        tx.set(db.doc(`gameStates/${request.auth.uid}`), { backpackLevel: upgradeOne.to }, { merge: true });
    });
    return { ok: true };
});
const introductionAnswers = { age: 'b', bases: 'a', mission: 'c', attitude: 'd', areas: 'a' };
exports.submitAdventurerIntroductionQuiz = (0, https_1.onCall)({ cors: localOrigins }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Autenticação necessária.');
    const { answers, attemptId } = request.data;
    if (!answers || typeof attemptId !== 'string' || attemptId.length < 8)
        throw new https_1.HttpsError('invalid-argument', 'Tentativa inválida.');
    const ids = Object.keys(introductionAnswers);
    if (ids.some(id => typeof answers[id] !== 'string'))
        throw new https_1.HttpsError('invalid-argument', 'Responda todas as perguntas.');
    const score = ids.reduce((total, id) => total + Number(answers[id] === introductionAnswers[id]), 0);
    const passed = score >= 3, uid = request.auth.uid, ref = db.doc(`users/${uid}/career/adventurerAdmission`);
    const result = await db.runTransaction(async (tx) => {
        const existing = await tx.get(ref);
        const current = existing.data()?.objectives?.introduction ?? {};
        if ((current.attemptIds ?? []).includes(attemptId))
            return { score: current.lastScore ?? score, passed: !!current.completed, duplicate: true };
        const completed = !!current.completed || passed;
        tx.set(ref, { objectives: { introduction: { completed, bestScore: Math.max(current.bestScore ?? 0, score), lastScore: score, totalQuestions: 5, attempts: (current.attempts ?? 0) + 1, attemptIds: [...(current.attemptIds ?? []), attemptId].slice(-30), completedAt: current.completedAt ?? (passed ? admin.firestore.FieldValue.serverTimestamp() : null), contentVersion: 'adventurer-introduction-v1' } }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return { score, passed, duplicate: false };
    });
    return result;
});
const SIZE = 256;
const land = (x, y) => { const dx = (x - 127.5) / 117, dy = (y - 127.5) / 117; return x >= 3 && y >= 3 && x < SIZE - 3 && y < SIZE - 3 && Math.hypot(dx, dy) < .95 && Math.abs(x - (127 + 18 * Math.sin((y + 207) / 33))) > 5; };
const validGrid = (x, y) => Number.isInteger(x) && Number.isInteger(y) && land(Number(x), Number(y));
exports.claimCampPlot = (0, https_1.onCall)({ cors: localOrigins }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Autenticação necessária.');
    const { name, islandId, sectorId, gridX, gridY } = request.data;
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 40 || typeof islandId !== 'string' || typeof sectorId !== 'string' || !validGrid(gridX, gridY))
        throw new https_1.HttpsError('invalid-argument', 'Terreno ou nome inválido.');
    const uid = request.auth.uid, campRef = db.doc(`camps/camp_${uid}`), stateRef = db.doc(`gameStates/${uid}`), x = Number(gridX), y = Number(gridY);
    await db.runTransaction(async (tx) => {
        const existing = await tx.get(campRef);
        if (existing.exists)
            return;
        const cells = [];
        for (let oy = -2; oy <= 2; oy++)
            for (let ox = -2; ox <= 2; ox++) {
                const cx = x + ox, cy = y + oy;
                if (!validGrid(cx, cy))
                    throw new https_1.HttpsError('failed-precondition', 'A barraca precisa ficar em solo livre.');
                cells.push(db.doc(`worldOccupancy/${islandId}_${sectorId}_${cx}_${cy}`));
            }
        const occupied = await Promise.all(cells.map(cell => tx.get(cell)));
        if (occupied.some(item => item.exists))
            throw new https_1.HttpsError('already-exists', 'Esse terreno acabou de ser reservado por outro aventureiro.');
        for (const cell of cells)
            tx.create(cell, { ownerId: uid, campId: campRef.id, islandId, sectorId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        const player = await tx.get(db.doc(`players/${uid}`));
        tx.create(campRef, { id: campRef.id, ownerId: uid, name: name.trim(), ownerNickname: player.data()?.nickname ?? 'Aventureiro', islandId, sectorId, gridX: x, gridY: y, tentLevel: 1, width: 5, height: 5, positionStatus: 'placed', createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        tx.set(stateRef, { campId: campRef.id, worldSectorId: sectorId, avatarPosition: { islandId, sectorId, gridX: x + 2, gridY: y + 2 } }, { merge: true });
    });
    return { ok: true, campId: campRef.id };
});
exports.saveAvatarPosition = (0, https_1.onCall)({ cors: localOrigins }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Autenticação necessária.');
    const { islandId, sectorId, gridX, gridY } = request.data;
    if (typeof islandId !== 'string' || typeof sectorId !== 'string' || !validGrid(gridX, gridY))
        throw new https_1.HttpsError('invalid-argument', 'Posição inválida.');
    await db.doc(`gameStates/${request.auth.uid}`).set({ avatarPosition: { islandId, sectorId, gridX, gridY }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { ok: true };
});

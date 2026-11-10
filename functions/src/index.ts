import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
admin.initializeApp();
/** Server-owned idempotent player initialization. The app should call this after profile validation. */
// Expo may select a different development port when the default is occupied.
// Keep this permissive only for local HTTP development; deployed sites must be
// added explicitly instead of allowing arbitrary external origins.
const localOrigins = [/^http:\/\/localhost:\d+$/];

export const initializePlayer = onCall({ cors: localOrigins }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  const { nickname, fullName, birthDate, avatarId, campName } = request.data as Record<string, string>;
  if (!nickname || !fullName || !birthDate || !avatarId || !campName) throw new HttpsError('invalid-argument', 'Dados de perfil incompletos.');
  const authContext = request.auth; const uid = authContext.uid; const db = admin.firestore(); const nameKey = nickname.trim().toLowerCase();
  await db.runTransaction(async tx => { const playerRef=db.doc(`players/${uid}`), usernameRef=db.doc(`usernames/${nameKey}`); const existing=await tx.get(playerRef); if(existing.exists && existing.data()?.profileCompleted) return; const name=await tx.get(usernameRef); if(name.exists && name.data()?.uid!==uid) throw new HttpsError('already-exists','Este apelido já está em uso.'); tx.set(usernameRef,{uid}); tx.set(playerRef,{uid,nickname,avatarId,campName,profileCompleted:true,createdAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true}); tx.set(db.doc(`users/${uid}/private/profile`),{fullName,birthDate,email:authContext.token.email??''},{merge:true}); tx.set(db.doc(`gameStates/${uid}`),{playerId:uid,playerLevel:1,playerXp:0,league:'aspirante',coins:100,campId:'',worldSectorId:'vale-recomeco-01'},{merge:true}); }); return { ok:true };
});

const SIZE = 256;
const land = (x: number, y: number) => { const dx=(x-127.5)/117, dy=(y-127.5)/117; return x>=3 && y>=3 && x<SIZE-3 && y<SIZE-3 && Math.hypot(dx,dy)<.95 && Math.abs(x-(127+18*Math.sin((y+207)/33)))>5; };
const validGrid = (x: unknown, y: unknown) => Number.isInteger(x) && Number.isInteger(y) && land(Number(x), Number(y));

/** Atomically reserves every cell in a level-1 tent footprint before creating the public camp. */
export const claimCampPlot = onCall({ cors: localOrigins }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  const { name, islandId, sectorId, gridX, gridY } = request.data as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 40 || typeof islandId !== 'string' || typeof sectorId !== 'string' || !validGrid(gridX, gridY)) throw new HttpsError('invalid-argument', 'Terreno ou nome inválido.');
  const uid=request.auth.uid, db=admin.firestore(), campRef=db.doc(`camps/camp_${uid}`), stateRef=db.doc(`gameStates/${uid}`); const x=Number(gridX), y=Number(gridY);
  await db.runTransaction(async tx => {
    const existing=await tx.get(campRef); if(existing.exists) return;
    const cells: admin.firestore.DocumentReference[]=[]; for(let oy=-2;oy<=2;oy++) for(let ox=-2;ox<=2;ox++){ const cx=x+ox, cy=y+oy; if(!validGrid(cx,cy)) throw new HttpsError('failed-precondition','A barraca precisa ficar em solo livre.'); cells.push(db.doc(`worldOccupancy/${islandId}_${sectorId}_${cx}_${cy}`)); }
    const occupied=await Promise.all(cells.map(cell=>tx.get(cell))); if(occupied.some(item=>item.exists)) throw new HttpsError('already-exists','Esse terreno acabou de ser reservado por outro aventureiro.');
    for(const cell of cells) tx.create(cell,{ownerId:uid,campId:campRef.id,islandId,sectorId,createdAt:admin.firestore.FieldValue.serverTimestamp()});
    const player=await tx.get(db.doc(`players/${uid}`)); tx.create(campRef,{id:campRef.id,ownerId:uid,name:name.trim(),ownerNickname:player.data()?.nickname??'Aventureiro',islandId,sectorId,gridX:x,gridY:y,tentLevel:1,width:5,height:5,positionStatus:'placed',createdAt:admin.firestore.FieldValue.serverTimestamp(),updatedAt:admin.firestore.FieldValue.serverTimestamp()}); tx.set(stateRef,{campId:campRef.id,worldSectorId:sectorId,avatarPosition:{islandId,sectorId,gridX:x+2,gridY:y+2}}, {merge:true});
  }); return { ok:true, campId:campRef.id };
});

export const saveAvatarPosition = onCall({ cors: localOrigins }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.'); const { islandId, sectorId, gridX, gridY }=request.data as Record<string, unknown>;
  if(typeof islandId!=='string'||typeof sectorId!=='string'||!validGrid(gridX,gridY)) throw new HttpsError('invalid-argument','Posição inválida.');
  await admin.firestore().doc(`gameStates/${request.auth.uid}`).set({avatarPosition:{islandId,sectorId,gridX,gridY},updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true}); return {ok:true};
});

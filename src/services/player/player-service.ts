import { auth, db } from '@/services/firebase/config';
import type { Camp, Inventory, Player, PlayerGameState, PrivateProfile } from '@/types/game';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export async function getPlayer(uid: string): Promise<Player | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'players', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<Player>;
  return { ...data, uid, profileCompleted: data.profileCompleted === true || Boolean(data.nickname && data.avatarId) } as Player;
}
export async function saveProfile(uid: string, publicPlayer: Player, privateProfile: PrivateProfile): Promise<void> {
  if (!db || !auth?.currentUser || auth.currentUser.uid !== uid) throw new Error('Firebase ainda não foi configurado.');
  const initialize = httpsCallable(getFunctions(), 'initializePlayer');
  await initialize({ nickname: publicPlayer.nickname, fullName: privateProfile.fullName, birthDate: privateProfile.birthDate, avatarId: publicPlayer.avatarId, campName: publicPlayer.campName });
}

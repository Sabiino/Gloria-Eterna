import { auth, firebaseEnabled } from '@/services/firebase/config';
import { getPlayer } from '@/services/player/player-service';
import type { Player } from '@/types/game';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { createContext, useEffect, useState } from 'react';

type AuthValue = { user: User | null; player: Player | null; loading: boolean; refreshPlayer: () => Promise<void>; logout: () => Promise<void>; configured: boolean };
export const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) { const [user, setUser] = useState<User | null>(null); const [player, setPlayer] = useState<Player | null>(null); const [loading, setLoading] = useState(true); const refreshPlayer = async () => { if (user) setPlayer(await getPlayer(user.uid)); }; useEffect(() => { if (!auth) { setLoading(false); return; } return onAuthStateChanged(auth, async next => { setUser(next); setPlayer(next ? await getPlayer(next.uid) : null); setLoading(false); }); }, []); return <AuthContext value={{ user, player, loading, refreshPlayer, logout: async () => { if (auth) await signOut(auth); }, configured: firebaseEnabled }}>{children}</AuthContext>; }

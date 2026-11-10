import { useAuth } from '@/hooks/use-auth';
import { db } from '@/services/firebase/config';
import type { PlayerGameState } from '@/types/game';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

const defaultState: PlayerGameState = {
  playerId: '', playerLevel: 1, playerXp: 0, league: 'aspirante', leagueXp: 0,
  tentLevel: 1, backpackLevel: 1, coins: 0, gems: 0, clubId: null,
  worldSectorId: '', campId: '', currentMissionId: '', completedMissions: [],
};

/** Keeps one realtime subscription for the game-state values shown in the header. */
export function usePlayerHeader() {
  const { user, player } = useAuth();
  const [gameState, setGameState] = useState<PlayerGameState>(defaultState);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!db || !user) { setLoading(false); return; }
    setLoading(true);
    return onSnapshot(doc(db, 'gameStates', user.uid), snapshot => {
      setGameState({ ...defaultState, playerId: user.uid, ...(snapshot.data() as Partial<PlayerGameState> | undefined) });
      setLoading(false);
    }, () => setLoading(false));
  }, [user?.uid]);

  return useMemo(() => ({
    player,
    loading,
    level: Math.max(1, Number(gameState.playerLevel) || 1),
    xp: Math.max(0, Number(gameState.playerXp) || 0),
    xpGoal: 150,
    league: gameState.league || 'aspirante',
    coins: Math.max(0, Number(gameState.coins) || 0),
    gems: Math.max(0, Number(gameState.gems) || 0),
    tentLevel: Math.max(1, Number(gameState.tentLevel) || 1),
    clubId: gameState.clubId,
  }), [player, loading, gameState]);
}

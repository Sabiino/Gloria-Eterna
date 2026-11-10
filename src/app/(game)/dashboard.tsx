import { GameHeader } from '../../components/game/home/GameHeader';
import { GameHomeBackground } from '@/components/game/home/GameHomeBackground';
import { GameBottomToolbar } from '@/components/game/home/GameBottomToolbar';
import { StyleSheet, View } from 'react-native';
import { HomeCampScene } from '@/components/game/home/tent/HomeCampScene';
import { TentDetailsPanel } from '@/components/game/home/tent/TentDetailsPanel';
import { usePlayerHeader } from '@/hooks/use-player-header';
import { useState } from 'react';
import { CharacterDetailsPanel } from '@/components/game/home/CharacterDetailsPanel';
import { getCampAvatar } from '@/constants/avatarCatalog';

export default function Dashboard() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [characterOpen, setCharacterOpen] = useState(false);
  const { player, tentLevel, league } = usePlayerHeader();
  const avatar = getCampAvatar(player?.avatarId);
  return (
    <GameHomeBackground>
      <View style={styles.page}>
        <GameHeader />
        <HomeCampScene avatarId={player?.avatarId} onTentPress={() => setDetailsOpen(true)} onCharacterPress={() => setCharacterOpen(true)} />
        <GameBottomToolbar />
        <TentDetailsPanel visible={detailsOpen} onClose={() => setDetailsOpen(false)} tentLevel={tentLevel} league={league} campName={player?.campName} />
        <CharacterDetailsPanel visible={characterOpen} onClose={() => setCharacterOpen(false)} name={player?.nickname || 'Aventureiro'} league={league} avatar={avatar} />
      </View>
    </GameHomeBackground>
  );
}

const styles = StyleSheet.create({ page: { flex: 1, width: '100%', paddingTop: 52, paddingHorizontal: 14, paddingBottom: 24 } });

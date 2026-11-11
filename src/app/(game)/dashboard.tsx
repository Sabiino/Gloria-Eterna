import { GameHeader } from '../../components/game/home/GameHeader';
import { GameHomeBackground } from '@/components/game/home/GameHomeBackground';
import { GameBottomToolbar } from '@/components/game/home/GameBottomToolbar';
import { StyleSheet, View } from 'react-native';
import { HomeCampScene } from '@/components/game/home/tent/HomeCampScene';
import { usePlayerHeader } from '@/hooks/use-player-header';
import { useState } from 'react';
import { CharacterDetailsPanel } from '@/components/game/home/CharacterDetailsPanel';
import { getCampAvatar } from '@/constants/avatarCatalog';
import { isMobileGameHeader } from '@/theme/breakpoints';
import { useWindowDimensions } from 'react-native';

export default function Dashboard() {
  const [characterOpen, setCharacterOpen] = useState(false);
  const { player, league } = usePlayerHeader();
  const avatar = getCampAvatar(player?.avatarId);
  const { width } = useWindowDimensions();
  const isMobile = isMobileGameHeader(width);
  return (
    <GameHomeBackground clean>
      <View style={[styles.page, isMobile && styles.mobilePage]}>
        <GameHeader />
        <HomeCampScene onCharacterPress={() => setCharacterOpen(true)} />
        <GameBottomToolbar />
        <CharacterDetailsPanel visible={characterOpen} onClose={() => setCharacterOpen(false)} name={player?.nickname || 'Aventureiro'} league={league} avatar={avatar} />
      </View>
    </GameHomeBackground>
  );
}

const styles = StyleSheet.create({ page: { flex: 1, minHeight: 0, width: '100%', paddingTop: 52, paddingHorizontal: 14, paddingBottom: 24 }, mobilePage: { paddingTop: 18 } });

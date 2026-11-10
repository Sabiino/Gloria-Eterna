import type { AvatarId } from '@/types/game';
import { getCampAvatar } from '@/constants/avatarCatalog';
import { CampGround } from '../CampGround';
import { CampCharacter } from '../CampCharacter';
import { CentralTent } from './CentralTent';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

type Props = { avatarId?: AvatarId; onTentPress: () => void; onCharacterPress: () => void };

/** Coordinates are ratios of the stage, preserving the composition on all screen sizes. */
export function HomeCampScene({ avatarId, onTentPress, onCharacterPress }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const avatar = getCampAvatar(avatarId);
  return <View style={[styles.scene, compact && styles.sceneCompact]}><View style={styles.stage}><CampGround /><View pointerEvents="none" style={styles.tentShadow} /><CentralTent onPress={onTentPress} style={[styles.tent, compact && styles.tentCompact]} /><View style={[styles.character, compact && styles.characterCompact]}><CampCharacter avatar={avatar} onPress={onCharacterPress} /></View><View pointerEvents="none" style={[styles.plant, styles.plantLeft]} /><View pointerEvents="none" style={[styles.plant, styles.plantRight]} /></View></View>;
}
const styles = StyleSheet.create({ scene: { flex: 1, width: '100%', maxWidth: 820, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 10 }, sceneCompact: { justifyContent: 'center', paddingVertical: 6 }, stage: { width: '100%', aspectRatio: 1.45, maxHeight: 465, alignSelf: 'center', position: 'relative' }, tentShadow: { position: 'absolute', width: '51%', height: '17%', right: '7%', bottom: '24%', borderRadius: 999, backgroundColor: 'rgba(1,28,21,.37)', transform: [{ rotate: '-4deg' }] }, tent: { position: 'absolute', width: '65%', height: '83%', right: '2%', bottom: '8%', zIndex: 4 }, tentCompact: { width: '66%', right: '0%', bottom: '10%' }, character: { position: 'absolute', width: '24%', height: '52%', left: '12%', bottom: '24%', zIndex: 5 }, characterCompact: { width: '27%', height: '52%', left: '8%', bottom: '24%' }, plant: { position: 'absolute', width: 20, height: 38, borderRadius: 14, backgroundColor: '#337139', borderWidth: 2, borderColor: '#78B75B', zIndex: 6 }, plantLeft: { left: '7%', bottom: '27%', transform: [{ rotate: '-19deg' }] }, plantRight: { right: '7%', bottom: '21%', transform: [{ rotate: '24deg' }] } });

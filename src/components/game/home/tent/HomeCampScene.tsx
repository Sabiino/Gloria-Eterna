import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import type { AvatarId } from '@/types/game';
import { getCampAvatar } from '@/constants/avatarCatalog';
import { CampCharacter } from '../CampCharacter';
import { CentralTent } from './CentralTent';

type Props = { avatarId?: AvatarId; nickname: string; onTentPress: () => void; onCharacterPress: () => void };
type Bounds = { width: number; height: number };

/** The tent and avatar share one responsive stage, so they always scale together. */
export function HomeCampScene({ avatarId, nickname, onTentPress, onCharacterPress }: Props) {
  const [bounds, setBounds] = useState<Bounds>({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== bounds.width || height !== bounds.height) setBounds({ width, height });
  };
  const size = Math.max(0, Math.min(bounds.width, bounds.height, 760));

  return <View style={styles.scene} onLayout={onLayout}>
    {size > 0 ? <View style={[styles.stage, { width: size, height: size }]}>
      <CentralTent onPress={onTentPress} style={styles.tent} />
      <View style={styles.character}>
        <CampCharacter avatar={getCampAvatar(avatarId)} nickname={nickname} onPress={onCharacterPress} />
      </View>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  scene: { flex: 1, flexShrink: 1, minHeight: 0, width: '100%', maxWidth: 760, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  stage: { position: 'relative', alignSelf: 'center' },
  tent: { position: 'absolute', inset: 0 },
  character: { position: 'absolute', left: '7%', top: '12%', width: '40%', height: '53.333%', zIndex: 2 },
});

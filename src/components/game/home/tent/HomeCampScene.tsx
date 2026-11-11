import { StyleSheet, View } from 'react-native';
import { Avatar3DViewer } from '../Avatar3DViewer';
import { useOfficialUniform } from '@/hooks/use-official-uniform';

type Props = { onCharacterPress: () => void };

/** The home stage now contains only the interactive 3D adventurer. */
export function HomeCampScene({ onCharacterPress }: Props) {
  const { layers } = useOfficialUniform();
  return <View style={styles.scene}>
    <Avatar3DViewer autoRotate={false} enableRotation enableZoom showControls onDetailsPress={onCharacterPress} uniformLayers={layers} />
  </View>;
}

const styles = StyleSheet.create({
  scene: { flex: 1, flexShrink: 1, minHeight: 0, width: '100%', maxWidth: 760, alignSelf: 'center', justifyContent: 'center' },
});

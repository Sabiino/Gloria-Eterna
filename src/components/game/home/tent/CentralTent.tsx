import { Image, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
const tent = require('../../../../assets/game/tents/tent-level-01-v2.png');
export function CentralTent({ onPress, style }: { onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Abrir detalhes da Barraca Central" onPress={onPress} style={style}>
    <Image source={tent} resizeMode="contain" style={styles.image} />
  </Pressable>;
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});

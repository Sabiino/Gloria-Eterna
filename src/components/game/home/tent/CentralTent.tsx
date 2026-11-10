import { Animated, Image, Pressable, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useState } from 'react';
import { gameColors } from '@/theme/gameColors';

const tent = require('../../../../assets/game/tents/tent-level-01.png');

export function CentralTent({ onPress, style }: { onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const [scale] = useState(() => new Animated.Value(1));
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const activate = () => {
    Animated.sequence([Animated.timing(scale, { toValue: 0.95, duration: 90, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 })]).start();
    onPress();
  };
  return <Pressable accessibilityRole="button" accessibilityLabel="Abrir detalhes da Barraca Central" onPress={activate} style={[styles.touch, style]}>
    <Animated.View style={[styles.wrap, compact && styles.wrapCompact, { transform: [{ scale }] }]}>
      <View style={styles.glow} /><View style={styles.shadow} />
      <Image source={tent} resizeMode="contain" style={styles.image} />
    </Animated.View>
  </Pressable>;
}
const styles = StyleSheet.create({
  touch: { width: '100%', alignItems: 'center', justifyContent: 'center' }, wrap: { width: '100%', maxWidth: 470, aspectRatio: 1.12, alignItems: 'center', justifyContent: 'center' }, wrapCompact: { maxWidth: 300, aspectRatio: 1.18 },
  image: { width: '100%', height: '100%', zIndex: 2 }, glow: { position: 'absolute', width: '77%', height: '52%', borderRadius: 999, backgroundColor: 'rgba(244,188,63,.14)', shadowColor: gameColors.gold, shadowOpacity: .72, shadowRadius: 28, elevation: 6 },
  shadow: { position: 'absolute', bottom: '12%', width: '74%', height: '13%', borderRadius: 999, backgroundColor: 'rgba(1,20,17,.62)', transform: [{ scaleX: 1.15 }] },
});

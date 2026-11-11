import { ImageBackground, StyleSheet, View } from 'react-native';

const forestBackground = require('../../../../assets/images/game/backgrounds/home-forest-mountains.png');

export function GameHomeBackground({ children, clean = false }: { children: React.ReactNode; clean?: boolean }) {
  if (clean) return <View style={styles.cleanBackground}>{children}</View>;
  return <ImageBackground source={forestBackground} resizeMode="cover" style={styles.background} imageStyle={styles.image}>
    <View pointerEvents="none" style={styles.shade} />
    {children}
  </ImageBackground>;
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0B392D' },
  cleanBackground: { flex: 1, backgroundColor: '#0B392D' },
  image: { opacity: 0.94 },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4, 28, 26, 0.20)' },
});

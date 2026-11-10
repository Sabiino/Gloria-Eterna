import type { AvatarId } from '@/types/game';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { gameColors } from '@/theme/gameColors';

const symbols: Record<AvatarId, string> = { 'campista-1': '⛺', 'campista-2': '🧭', 'campista-3': '🌲', 'campista-4': '🏕' };
export function PlayerAvatar({ avatarId = 'campista-1', onPress }: { avatarId?: AvatarId; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={onPress} style={({ pressed }) => [styles.touch, pressed && styles.pressed]}>
    <View style={styles.ring}><View style={styles.inner}><Text style={styles.symbol}>{symbols[avatarId]}</Text></View></View>
  </Pressable>;
}
const styles = StyleSheet.create({
  touch: { borderRadius: 999 }, pressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
  ring: { width: 70, height: 70, padding: 4, borderRadius: 999, backgroundColor: gameColors.gold, shadowColor: '#000', shadowOpacity: .36, shadowRadius: 7, elevation: 5 },
  inner: { flex: 1, borderRadius: 999, backgroundColor: '#126050', borderWidth: 2, borderColor: gameColors.parchment, alignItems: 'center', justifyContent: 'center' }, symbol: { fontSize: 32 },
});

import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { gameColors } from '@/theme/gameColors';

type Tool = { label: string; icon: string; action: () => void };
const comingSoon = (title: string) => Alert.alert(title, 'Esta área será liberada em uma próxima etapa.');

export function GameBottomToolbar() {
  const tools: Tool[] = [
    { label: 'Acampamento', icon: '⛺', action: () => router.replace('/(game)/dashboard') },
    { label: 'Atividades', icon: '🗺', action: () => comingSoon('Atividades') },
    { label: 'Mochila', icon: '🎒', action: () => comingSoon('Mochila') },
    { label: 'Liga', icon: '⌃', action: () => comingSoon('Liga') },
    { label: 'Clube', icon: '♟', action: () => comingSoon('Clube') },
    { label: 'Perfil', icon: '●', action: () => router.push('/(game)/profile') },
  ];

  return <View style={styles.wrap}><View style={styles.bar}>{tools.map((tool, index) => <Pressable key={tool.label} accessibilityRole="button" accessibilityLabel={tool.label} onPress={tool.action} style={({ pressed }) => [styles.tool, index === 0 && styles.active, pressed && styles.pressed]}><Text style={styles.icon}>{tool.icon}</Text><Text numberOfLines={1} style={styles.label}>{tool.label}</Text></Pressable>)}</View></View>;
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingTop: 10, alignItems: 'center' },
  bar: { width: '100%', maxWidth: 720, minHeight: 76, overflow: 'hidden', borderRadius: 22, borderWidth: 2, borderColor: 'rgba(68,177,137,.78)', backgroundColor: 'rgba(3, 45, 43, .94)', flexDirection: 'row', shadowColor: '#000', shadowOpacity: .42, shadowRadius: 11, elevation: 8 },
  tool: { flex: 1, minWidth: 0, paddingHorizontal: 3, paddingVertical: 7, alignItems: 'center', justifyContent: 'center', gap: 2, borderRightWidth: 1, borderRightColor: 'rgba(180,230,187,.17)' },
  active: { margin: 2, borderRadius: 16, borderWidth: 1, borderColor: gameColors.gold, backgroundColor: 'rgba(136,83,8,.62)', shadowColor: gameColors.gold, shadowOpacity: .8, shadowRadius: 8, elevation: 5 },
  pressed: { opacity: .74, transform: [{ scale: .96 }] },
  icon: { height: 29, color: gameColors.parchment, fontSize: 25, textAlign: 'center', textShadowColor: '#001B1A', textShadowRadius: 4 },
  label: { width: '100%', color: gameColors.cream, fontSize: 10, fontWeight: '800', textAlign: 'center' },
});

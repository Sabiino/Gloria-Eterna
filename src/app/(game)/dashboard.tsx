import { GameWorld } from '@/components/game/game-world';
import { GameButton } from '@/components/ui/game-ui';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

export default function Dashboard() {
  const { player } = useAuth();
  const [placing, setPlacing] = useState(false);

  return (
    <View style={styles.page}>
      <GameWorld placementEnabled={placing} onPlaced={() => setPlacing(false)} />
      <View pointerEvents="none" style={styles.header}>
        <View><Text style={styles.name}>{player?.nickname ?? 'Aventureiro'}</Text><Text style={styles.level}>Aspirante · Nv. 1</Text></View>
        <Text style={styles.coins}>◉ 100</Text>
      </View>
      <View style={styles.actions}>
        {placing ? <GameButton title="CANCELAR POSICIONAMENTO" variant="outline" onPress={() => setPlacing(false)} /> : <GameButton title="ESCOLHER MEU TERRENO" onPress={() => setPlacing(true)} />}
        <Pressable style={styles.profile} onPress={() => router.push('/(game)/profile')}><Text style={styles.profileText}>Perfil</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.ink },
  header: { position: 'absolute', top: 52, left: 16, right: 16, zIndex: 10, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(214,168,79,.42)', backgroundColor: 'rgba(16,28,24,.88)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '900', color: colors.sand },
  level: { color: colors.muted, fontSize: 12 },
  coins: { color: colors.gold, fontWeight: '900' },
  actions: { position: 'absolute', left: 16, bottom: 22, zIndex: 20, maxWidth: '92%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  profile: { minHeight: 52, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.gold, backgroundColor: 'rgba(23,61,50,.96)' },
  profileText: { color: colors.sand, fontWeight: '800' },
});

import { StyleSheet, Text, View } from 'react-native';
import { gameColors } from '@/theme/gameColors';

export function BackpackStats({ level, used, capacity }: { level: number; used: number; capacity: number }) {
  const values = [{ label: 'NÍVEL ATUAL', value: `Nível ${level}`, glyph: '▮▮▮' }, { label: 'CAPACIDADE', value: `${capacity} espaços`, glyph: '◇' }, { label: 'OCUPADOS', value: `${used} ocupados`, glyph: '▣' }, { label: 'DISPONÍVEIS', value: `${Math.max(0, capacity - used)} livres`, glyph: '+' }];
  return <View style={styles.wrap}>{values.map(entry => <View key={entry.label} style={styles.row}><Text style={styles.glyph}>{entry.glyph}</Text><View><Text style={styles.label}>{entry.label}</Text><Text selectable style={styles.value}>{entry.value}</Text></View></View>)}</View>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 170, padding: 16, borderRadius: 21, borderWidth: 1.5, borderColor: 'rgba(229,179,78,.78)', backgroundColor: 'rgba(4,43,33,.93)', gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(229,179,78,.19)' },
  glyph: { width: 29, color: '#FFD875', fontSize: 20, lineHeight: 22, textAlign: 'center', fontWeight: '900' },
  label: { color: gameColors.muted, fontSize: 9, fontWeight: '900', letterSpacing: .6 },
  value: { color: gameColors.cream, fontSize: 14, lineHeight: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
});

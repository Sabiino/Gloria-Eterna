import { StyleSheet, Text } from 'react-native';
import { gameColors } from '@/theme/gameColors';

export function PlayerLeagueLabel({ league }: { league: string }) {
  const label = league ? `${league.slice(0, 1).toUpperCase()}${league.slice(1)}` : 'Aspirante';
  return <Text style={styles.label}>{label}</Text>;
}

const styles = StyleSheet.create({ label: { color: gameColors.parchment, fontSize: 14, fontWeight: '800' } });

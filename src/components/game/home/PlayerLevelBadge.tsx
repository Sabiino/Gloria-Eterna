import { StyleSheet, Text, View } from 'react-native';
import { gameColors } from '@/theme/gameColors';
export function PlayerLevelBadge({ level }: { level: number }) { return <View style={styles.badge}><Text style={styles.value}>{level}</Text></View>; }
const styles = StyleSheet.create({ badge: { width: 31, height: 36, marginRight: 7, backgroundColor: gameColors.goldDeep, borderWidth: 2, borderColor: gameColors.gold, borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: .3, shadowRadius: 3, elevation: 3 }, value: { color: gameColors.white, fontSize: 17, fontWeight: '900' } });

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { gameColors } from '@/theme/gameColors';
export function PlayerExperienceBar({ current, goal }: { current: number; goal: number }) {
  const progress = Math.min(1, current / Math.max(1, goal)); const width = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(width, { toValue: progress, duration: 520, useNativeDriver: false }).start(); }, [progress, width]);
  return <View style={styles.track}><Animated.View style={[styles.fill, { width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /><Text style={styles.label}>XP {current} / {goal}</Text></View>;
}
const styles = StyleSheet.create({ track: { height: 21, minWidth: 142, overflow: 'hidden', borderRadius: 999, borderWidth: 2, borderColor: '#2A8B98', backgroundColor: '#062B35', justifyContent: 'center' }, fill: { ...StyleSheet.absoluteFill, backgroundColor: '#D99B26', opacity: .88 }, label: { color: gameColors.white, textAlign: 'center', fontSize: 11, lineHeight: 17, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 3 } });

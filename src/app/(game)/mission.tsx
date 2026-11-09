import { GameButton, GameCard } from '@/components/ui/game-ui';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, space } from '@/theme/tokens';

export default function Mission() {
  return <ScrollView style={s.bg} contentContainerStyle={s.page}>
    <Text style={s.title}>Um Novo Começo</Text>
    <GameCard><Text style={s.heading}>Missão 001</Text><Text>Monte sua primeira barraca e prepare seu acampamento.</Text><Text>O sistema de construção chegará em uma atualização futura. Por enquanto, explore o mapa e conheça sua nova região.</Text></GameCard>
    <GameButton title="VOLTAR AO MAPA" onPress={() => router.replace('/(game)/dashboard')} />
  </ScrollView>;
}

const s = StyleSheet.create({ bg: { flex: 1, backgroundColor: colors.ink }, page: { padding: space.lg, paddingTop: 90, gap: space.md }, title: { fontSize: 30, color: colors.sand, fontWeight: '900' }, heading: { fontWeight: '900', color: colors.forest } });

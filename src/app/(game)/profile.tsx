import { AvatarSelector } from '@/components/game/avatar-selector';
import { GameButton, GameInput, Notice } from '@/components/ui/game-ui';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/services/firebase/config';
import type { AvatarId } from '@/types/game';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/theme/tokens';

export default function Profile() {
  const { user, player, logout, refreshPlayer } = useAuth();
  const [camp, setCamp] = useState(player?.campName ?? '');
  const [avatar, setAvatar] = useState<AvatarId>(player?.avatarId ?? 'campista-1');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  const save = async () => {
    if (!db || !user) return;
    try {
      setSaving(true);
      setMessage('');
      await updateDoc(doc(db, 'players', user.uid), { campName: camp.trim(), avatarId: avatar });
      await refreshPlayer();
      setMessage('Alterações salvas.');
    } catch {
      setMessage('Não foi possível salvar agora. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const endSession = async () => {
    try {
      setEndingSession(true);
      setMessage('');
      await logout();
      router.replace('/(auth)/login');
    } catch {
      setMessage('Não foi possível encerrar a sessão agora. Tente novamente.');
    } finally {
      setEndingSession(false);
    }
  };

  return <ScrollView style={styles.background} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.topbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao acampamento" onPress={() => router.replace('/(game)/dashboard')} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>ACAMPAMENTO</Text>
      </Pressable>
    </View>

    <View style={styles.heading}><Text style={styles.eyebrow}>IDENTIDADE DO AVENTUREIRO</Text><Text style={styles.title}>Meu perfil</Text><Text style={styles.subtitle}>Personalize seu acampamento e uniforme.</Text></View>

    <View style={styles.summary}>
      <View style={styles.summaryBadge}><Text style={styles.summaryInitial}>{(player?.nickname ?? 'A').slice(0, 1).toUpperCase()}</Text></View>
      <View style={styles.summaryCopy}><Text style={styles.name}>{player?.nickname ?? 'Aventureiro'}</Text><Text style={styles.level}>ASPIRANTE · NÍVEL 1</Text><Text style={styles.meta}>Barraca nível 1  ·  Mochila nível 1</Text></View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ACAMPAMENTO</Text>
      <GameInput label="Nome do acampamento" value={camp} onChangeText={setCamp} maxLength={40} />
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>UNIFORME</Text>
      <Text style={styles.sectionCopy}>Escolha a versão do Miguel que será exibida no seu acampamento.</Text>
      <AvatarSelector value={avatar} onChange={setAvatar} />
    </View>

    {message ? <Notice>{message}</Notice> : null}
    <GameButton title="SALVAR ALTERAÇÕES" onPress={save} loading={saving} />
    <GameButton title="GERENCIADOR DE UNIFORME" onPress={() => router.push('/(game)/admin-uniform')} />
    <GameButton title="ENCERRAR SESSÃO" variant="outline" onPress={endSession} loading={endingSession} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.ink },
  page: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: space.lg, paddingTop: 28, paddingBottom: 42, gap: space.md },
  topbar: { minHeight: 38, justifyContent: 'center' },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34, paddingHorizontal: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(214,168,79,.55)', backgroundColor: 'rgba(214,168,79,.10)' },
  backArrow: { color: colors.gold, fontSize: 28, lineHeight: 28, marginTop: -2 },
  backText: { color: colors.sand, fontWeight: '900', fontSize: 11, letterSpacing: .5 },
  heading: { gap: 4, marginTop: 2 },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.sand, fontSize: 31, lineHeight: 37, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 14 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(214,168,79,.42)', backgroundColor: '#FFF9EC' },
  summaryBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest, borderWidth: 2, borderColor: colors.gold },
  summaryInitial: { color: colors.cream, fontWeight: '900', fontSize: 22 },
  summaryCopy: { flex: 1, gap: 3 },
  name: { color: colors.forest, fontSize: 20, lineHeight: 24, fontWeight: '900' },
  level: { color: colors.green, fontSize: 11, fontWeight: '900', letterSpacing: .4 },
  meta: { color: '#53655D', fontSize: 12 },
  section: { gap: 9, padding: 15, borderRadius: radius.md, backgroundColor: 'rgba(6,46,41,.58)', borderWidth: 1, borderColor: 'rgba(243,232,208,.14)' },
  sectionTitle: { color: colors.gold, fontSize: 12, fontWeight: '900', letterSpacing: .8 },
  sectionCopy: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: -3 },
  pressed: { opacity: .75, transform: [{ scale: .97 }] },
});

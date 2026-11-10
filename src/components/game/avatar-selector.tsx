import { getCampAvatar } from '@/constants/avatarCatalog';
import type { AvatarId } from '@/types/game';
import { colors } from '@/theme/tokens';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const choices: { id: AvatarId; label: string; detail: string }[] = [
  { id: 'campista-1', label: 'Miguel · Clássico', detail: 'Bege e verde' },
  { id: 'campista-2', label: 'Miguel · Cerimônia', detail: 'Branco e azul-marinho' },
];

export function AvatarSelector({ value, onChange }: { value: AvatarId; onChange: (id: AvatarId) => void }) {
  return <View style={s.grid}>{choices.map(choice => {
    const avatar = getCampAvatar(choice.id);
    return <Pressable key={choice.id} accessibilityRole="radio" accessibilityState={{ selected: value === choice.id }} onPress={() => onChange(choice.id)} style={[s.item, value === choice.id && s.selected]}>
      <View style={s.art}>{avatar.image ? <Image source={avatar.image} resizeMode="contain" style={s.image} /> : null}</View>
      <View style={s.copy}><Text style={s.label}>{choice.label}</Text><Text style={s.detail}>{choice.detail}</Text></View>
    </Pressable>;
  })}</View>;
}

const s = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, item: { width: '47%', minHeight: 178, overflow: 'hidden', borderRadius: 16, backgroundColor: '#F8F4EA', borderWidth: 2, borderColor: 'transparent' }, selected: { borderColor: colors.gold, backgroundColor: '#FFF9E8' }, art: { height: 125, backgroundColor: '#F7F6F5', alignItems: 'center', justifyContent: 'center' }, image: { width: '100%', height: '156%', marginTop: 23 }, copy: { paddingHorizontal: 10, paddingBottom: 10 }, label: { color: colors.forest, fontWeight: '900', fontSize: 12 }, detail: { color: '#53655D', fontSize: 10, marginTop: 2 } });

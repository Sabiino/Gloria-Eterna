import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CampAvatar } from '@/constants/avatarCatalog';
import { gameColors } from '@/theme/gameColors';

export function CampCharacter({ avatar, onPress }: { avatar: CampAvatar; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir detalhes de ${avatar.name}`} onPress={onPress} style={({ pressed }) => [styles.touch, pressed && styles.pressed]}>
    <View style={styles.contactShadow} />
    {avatar.image ? <Image source={avatar.image} resizeMode="contain" style={styles.image} /> : <View style={styles.placeholder}><View style={styles.head}><Text style={styles.initial}>{avatar.genderVariant === 'female' ? 'F' : 'M'}</Text></View><View style={styles.body}><Text style={styles.pending}>ARTE{`\n`}PENDENTE</Text></View></View>}
    <Text style={styles.name}>{avatar.assetStatus === 'pending' ? `${avatar.name} · PREVIEW` : avatar.name}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ touch: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'flex-end' }, pressed: { opacity: .82, transform: [{ scale: .97 }] }, contactShadow: { position: 'absolute', bottom: 2, width: '72%', height: 13, borderRadius: 99, backgroundColor: 'rgba(1,27,19,.45)' }, image: { width: '100%', height: '100%' }, placeholder: { width: '74%', height: '88%', alignItems: 'center', justifyContent: 'flex-end' }, head: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#C99062', borderWidth: 3, borderColor: '#58371F', alignItems: 'center', justifyContent: 'center' }, initial: { color: '#FFF5DF', fontSize: 22, fontWeight: '900' }, body: { width: '76%', height: '62%', marginTop: -4, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 3, borderColor: '#69562B', backgroundColor: '#BFA86B', alignItems: 'center', justifyContent: 'center' }, pending: { color: '#173B34', fontSize: 9, fontWeight: '900', textAlign: 'center', lineHeight: 12 }, name: { position: 'absolute', bottom: -17, color: gameColors.cream, fontSize: 9, fontWeight: '900', backgroundColor: 'rgba(3,40,35,.78)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 } });

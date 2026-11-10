import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Image as SvgImage, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';
import type { CampAvatar } from '@/constants/avatarCatalog';
import { gameColors } from '@/theme/gameColors';

type Props = { visible: boolean; onClose: () => void; name: string; league: string; avatar: CampAvatar };

/** A close portrait uses the same original asset coordinates as the name strip. */
function CharacterPortrait({ avatar, nickname }: { avatar: CampAvatar; nickname: string }) {
  const whiteUniform = avatar.id === 'campista-2';
  const label = nickname.trim();
  const x = whiteUniform ? 520 : 512;
  const y = whiteUniform ? 481 : 476;
  const fontSize = Math.min(18, 116 / Math.max(1, Array.from(label).length));
  return <Svg width="100%" height="100%" viewBox="245 0 600 830" preserveAspectRatio="xMidYMid meet">
    {avatar.image ? <SvgImage href={avatar.image} x={0} y={0} width={1086} height={1448} /> : null}
    {avatar.image ? <SvgText x={x} y={y} transform={`rotate(-4 ${x} ${y})`} fill={whiteUniform ? '#182B54' : '#17392C'} fontWeight="800" fontFamily="Arial" fontSize={fontSize} textAnchor="middle">{label}</SvgText> : null}
  </Svg>;
}

export function CharacterDetailsPanel({ visible, onClose, name, league, avatar }: Props) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fechar painel do personagem" onPress={onClose} />
      <View accessibilityViewIsModal style={styles.panel}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
        <Text style={styles.title}>MEU PERSONAGEM</Text>
        <View style={styles.preview}><CharacterPortrait avatar={avatar} nickname={name} /></View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail}>Avatar: Miguel</Text>
        <Text style={styles.detail}>Liga: {league}</Text>
        <Text style={styles.detail}>Uniforme: {avatar.appearance}</Text>
        <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push('/(game)/profile'); }} style={styles.button}><Text style={styles.buttonText}>TROCAR UNIFORME</Text></Pressable>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, padding: 18, backgroundColor: 'rgba(1,18,17,.74)', justifyContent: 'center', alignItems: 'center' },
  panel: { width: '100%', maxWidth: 390, maxHeight: '90%', borderRadius: 26, paddingHorizontal: 20, paddingTop: 21, paddingBottom: 20, borderWidth: 2, borderColor: gameColors.gold, backgroundColor: '#073B35', alignItems: 'center' },
  close: { position: 'absolute', top: 12, right: 14, width: 33, height: 33, borderRadius: 18, borderWidth: 1, borderColor: gameColors.gold, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  closeText: { color: gameColors.cream, fontSize: 26, lineHeight: 29 },
  title: { color: gameColors.gold, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  preview: { width: 218, height: 234, marginTop: 5, marginBottom: 2, alignItems: 'center', justifyContent: 'center' },
  name: { color: gameColors.cream, fontSize: 21, fontWeight: '900', marginTop: 0 },
  detail: { alignSelf: 'stretch', color: gameColors.parchment, fontSize: 13, marginTop: 5 },
  button: { alignSelf: 'stretch', minHeight: 48, marginTop: 18, borderRadius: 12, backgroundColor: gameColors.gold, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#173B34', fontWeight: '900', fontSize: 13 },
});

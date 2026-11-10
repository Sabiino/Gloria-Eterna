import { Pressable } from 'react-native';
import Svg, { Image, Text } from 'react-native-svg';
import type { CampAvatar } from '@/constants/avatarCatalog';

/** Artwork and lettering share the original 1086 × 1448 coordinate system. */
export function CampCharacter({ avatar, nickname, onPress }: { avatar: CampAvatar; nickname: string; onPress: () => void }) {
  const white = avatar.id === 'campista-2';
  const label = nickname.trim();
  const x = white ? 520 : 512;
  const y = white ? 475 : 470;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Personagem de ${nickname}`} onPress={onPress} style={{ width: '100%', height: '100%' }}>
    <Svg width="100%" height="100%" viewBox="0 0 1086 1448">
      {avatar.image ? <Image href={avatar.image} width={1086} height={1448} /> : null}
      <Text x={x} y={y + 6} transform={`rotate(-4 ${x} ${y})`} fill={white ? '#182B54' : '#17392C'} fontWeight="bold" fontFamily="Arial" fontSize={Math.min(18, 116 / Math.max(1, Array.from(label).length))} textAnchor="middle">{label}</Text>
    </Svg>
  </Pressable>;
}

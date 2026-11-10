import type { AvatarId } from '@/types/game';
import type { ImageSourcePropType } from 'react-native';

export type CampAvatar = {
  id: AvatarId;
  name: string;
  genderVariant: 'male' | 'female';
  image?: ImageSourcePropType;
  appearance: string;
  width: number;
  height: number;
  scale: number;
  anchorX: number;
  anchorY: number;
  assetStatus: 'pending' | 'ready';
};

/** Replace `image` with approved local PNGs as they become available. */
export const avatarCatalog: Record<AvatarId, CampAvatar> = {
  'campista-1': { id: 'campista-1', name: 'Miguel', genderVariant: 'male', image: require('../assets/game/avatars/miguel-classic.png'), appearance: 'Uniforme bege e verde', width: 132, height: 220, scale: 1, anchorX: 0.5, anchorY: 1, assetStatus: 'ready' },
  'campista-2': { id: 'campista-2', name: 'Miguel', genderVariant: 'male', image: require('../assets/game/avatars/miguel-white.png'), appearance: 'Uniforme branco e azul-marinho', width: 132, height: 220, scale: 1, anchorX: 0.5, anchorY: 1, assetStatus: 'ready' },
  'campista-3': { id: 'campista-3', name: 'Guia', genderVariant: 'male', appearance: 'Variante masculina aguardando arte aprovada', width: 132, height: 220, scale: 1, anchorX: 0.5, anchorY: 1, assetStatus: 'pending' },
  'campista-4': { id: 'campista-4', name: 'Pioneira', genderVariant: 'female', appearance: 'Variante feminina aguardando arte aprovada', width: 132, height: 220, scale: 1, anchorX: 0.5, anchorY: 1, assetStatus: 'pending' },
};

export const getCampAvatar = (id?: AvatarId) => avatarCatalog[id ?? 'campista-1'];

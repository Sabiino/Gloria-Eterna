export type UniformCategory = string;

export type UniformRegionId = 'chest-left' | 'chest-right' | 'sleeve-left' | 'sleeve-right' | 'shoulders' | 'back' | 'custom';

export interface UniformLibraryImage {
  id: string;
  name: string;
  description?: string;
  category: UniformCategory;
  storagePath: string;
  downloadUrl: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  width?: number;
  height?: number;
  createdAt?: string;
  createdBy: string;
}

export interface UniformLayer {
  id: string;
  imageId: string;
  imageUrl: string;
  name: string;
  category: UniformCategory;
  region: UniformRegionId;
  /** Position and normal are local coordinates in the GLB scene. */
  position: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  /** Stable traversal index of the GLB mesh that received the projected decal. */
  surfaceMeshIndex?: number;
  rotation: number;
  width: number;
  height: number;
  opacity: number;
  order: number;
  visible: boolean;
  locked: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UniformRegion {
  id: UniformRegionId;
  name: string;
  camera: 'front' | 'back' | 'left' | 'right';
}

export const DEFAULT_UNIFORM_REGIONS: UniformRegion[] = [
  { id: 'chest-left', name: 'Peito esquerdo', camera: 'front' },
  { id: 'chest-right', name: 'Peito direito', camera: 'front' },
  { id: 'sleeve-left', name: 'Manga esquerda', camera: 'left' },
  { id: 'sleeve-right', name: 'Manga direita', camera: 'right' },
  { id: 'shoulders', name: 'Ombros', camera: 'front' },
  { id: 'back', name: 'Costas', camera: 'back' },
  { id: 'custom', name: 'Outra região', camera: 'front' },
];

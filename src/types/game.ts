export type League = 'aspirante';
export type AvatarId = 'campista-1' | 'campista-2' | 'campista-3' | 'campista-4';
export interface Player { uid: string; nickname: string; avatarId: AvatarId; profileCompleted: boolean; campName?: string; createdAt?: string; }
export interface PrivateProfile { fullName: string; birthDate: string; email: string; }
export interface PlayerGameState { playerId: string; playerLevel: number; playerXp: number; league: League; leagueXp: number; tentLevel: number; backpackLevel: number; coins: number; clubId: null; worldSectorId: string; campId: string; currentMissionId: string; completedMissions: string[]; }
export interface Camp { id: string; ownerId: string; name: string; tentLevel: number; plotWidth: number; plotHeight: number; buildings: Building[]; worldSectorId: string; positionStatus: 'not_selected' | 'placed'; islandId?: string; sectorId?: string; gridX?: number; gridY?: number; ownerNickname?: string; }
export interface Building { id: string; type: string; level: number; position: WorldCoordinate; }
export interface InventoryItem { id: string; name: string; quantity: number; special?: boolean; }
export interface Inventory { playerId: string; backpackLevel: number; backpackCapacity: number; items: InventoryItem[]; }
export interface WorldCoordinate { x: number; y: number; }
export interface WorldSector { id: string; name: string; description: string; }
export interface Mission { id: string; title: string; objective: string; status: 'Aguardando início'; }
export interface PlayerAchievement { id: string; unlockedAt?: string; }
export interface PlayerUniform { id: 'activity' | 'gala'; unlocked: boolean; }

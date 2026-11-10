export type BackpackRequirement = { itemId?: 'wood' | 'natural_fiber'; amount: number; label: string };
export type BackpackLevel = { level: number; name: string; capacity: number; appearance: string; benefits: string; requirements?: readonly BackpackRequirement[]; coinCost?: number; durationSeconds?: number; tentLevelRequired?: number };
export const backpackLevels: readonly BackpackLevel[] = [
  { level: 1, name: 'Mochila Inicial', capacity: 12, appearance: 'Lona verde', benefits: 'Armazena itens essenciais.' },
  { level: 2, name: 'Mochila Reforçada', capacity: 16, appearance: 'Lona reforçada', benefits: '+4 espaços.', requirements: [{ itemId: 'wood', amount: 60, label: 'Madeira' }, { itemId: 'natural_fiber', amount: 20, label: 'Fibra natural' }], coinCost: 25, durationSeconds: 180, tentLevelRequired: 2 },
  ...Array.from({ length: 8 }, (_, index) => { const level = index + 3; return { level, name: `Mochila nível ${level}`, capacity: 8 + level * 4, appearance: 'Em preparação', benefits: '+4 espaços.' }; }),
];
export const getBackpackLevel = (level: number) => backpackLevels.find(entry => entry.level === level) ?? backpackLevels[0];

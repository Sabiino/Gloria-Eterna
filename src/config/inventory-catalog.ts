export type InventoryCategory = 'materials' | 'equipment' | 'consumables' | 'special' | 'advanced_tools' | 'construction' | 'expedition' | 'special_materials';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type InventoryItemDefinition = { id: string; name: string; description: string; category: InventoryCategory; rarity: ItemRarity; image: string; maxStack: number; isStackable: boolean; isKeyItem: boolean; isConsumable: boolean; canEquip: boolean; availableActions: readonly string[] };

const item = (definition: InventoryItemDefinition) => definition;

export const inventoryCatalog = {
  wood: item({ id: 'wood', name: 'Madeira', description: 'Material utilizado na construção e melhoria de estruturas do acampamento.', category: 'materials', rarity: 'common', image: 'wood', maxStack: 100, isStackable: true, isKeyItem: false, isConsumable: false, canEquip: false, availableActions: ['visualizar'] }),
  stone: item({ id: 'stone', name: 'Pedra', description: 'Recurso resistente para construções e futuras melhorias.', category: 'materials', rarity: 'common', image: 'stone', maxStack: 100, isStackable: true, isKeyItem: false, isConsumable: false, canEquip: false, availableActions: ['visualizar'] }),
  natural_fiber: item({ id: 'natural_fiber', name: 'Fibra natural', description: 'Fibra coletada para criar cordas e aprimorar equipamentos.', category: 'materials', rarity: 'common', image: 'fiber', maxStack: 100, isStackable: true, isKeyItem: false, isConsumable: false, canEquip: false, availableActions: ['visualizar'] }),
  canteen: item({ id: 'canteen', name: 'Cantil', description: 'Equipamento essencial para manter água durante expedições.', category: 'equipment', rarity: 'common', image: 'canteen', maxStack: 1, isStackable: false, isKeyItem: false, isConsumable: false, canEquip: true, availableActions: ['visualizar'] }),
  rope: item({ id: 'rope', name: 'Corda', description: 'Equipamento usado em atividades de pioneiria e expedições.', category: 'equipment', rarity: 'common', image: 'rope', maxStack: 1, isStackable: false, isKeyItem: false, isConsumable: false, canEquip: false, availableActions: ['visualizar'] }),
  flashlight: item({ id: 'flashlight', name: 'Lanterna', description: 'Ilumina o caminho em explorações com pouca luz.', category: 'equipment', rarity: 'uncommon', image: 'flashlight', maxStack: 1, isStackable: false, isKeyItem: false, isConsumable: false, canEquip: true, availableActions: ['visualizar'] }),
  basic_tools: item({ id: 'basic_tools', name: 'Ferramentas básicas', description: 'Conjunto inicial para cuidar do acampamento.', category: 'equipment', rarity: 'uncommon', image: 'tools', maxStack: 1, isStackable: false, isKeyItem: false, isConsumable: false, canEquip: true, availableActions: ['visualizar'] }),
  bible: item({ id: 'bible', name: 'Bíblia', description: 'Item especial da jornada. Não ocupa espaço comum.', category: 'special', rarity: 'rare', image: 'bible', maxStack: 1, isStackable: false, isKeyItem: true, isConsumable: false, canEquip: false, availableActions: ['visualizar'] }),
  compass: item({ id: 'compass', name: 'Bússola', description: 'Item especial para orientar futuras explorações.', category: 'special', rarity: 'rare', image: 'compass', maxStack: 1, isStackable: false, isKeyItem: true, isConsumable: false, canEquip: false, availableActions: ['visualizar'] }),
} as const satisfies Record<string, InventoryItemDefinition>;

export type InventoryItemId = keyof typeof inventoryCatalog;
export const inventoryCategories = [
  { id: 'all', label: 'TODOS' }, { id: 'materials', label: 'MATERIAIS' }, { id: 'equipment', label: 'EQUIPAMENTOS' }, { id: 'consumables', label: 'CONSUMÍVEIS' }, { id: 'special', label: 'ESPECIAIS' },
] as const;

export const initialSlots = [
  { slotId: 'slot-01', itemId: 'wood', quantity: 40 }, { slotId: 'slot-02', itemId: 'stone', quantity: 15 }, { slotId: 'slot-03', itemId: 'natural_fiber', quantity: 10 },
  { slotId: 'slot-04', itemId: 'canteen', quantity: 1 }, { slotId: 'slot-05', itemId: 'rope', quantity: 1 }, { slotId: 'slot-06', itemId: 'flashlight', quantity: 1 }, { slotId: 'slot-07', itemId: 'basic_tools', quantity: 1 },
] as const;
export const initialKeyItems = ['bible', 'compass'] as const;

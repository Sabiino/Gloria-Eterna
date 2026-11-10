import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InventoryIcon } from '@/assets/game/inventory/InventoryAssets';
import { inventoryCatalog } from '@/config/inventory-catalog';
import type { InventorySlot } from '@/types/game';
import { gameColors } from '@/theme/gameColors';

export function SpecialItemsPanel({ slots, onSelect }: { slots: InventorySlot[]; onSelect: (slot: InventorySlot) => void }) {
  return <View style={styles.wrap}><View style={styles.titleRow}><View style={styles.line}/><Text style={styles.title}>ITENS ESPECIAIS</Text><View style={styles.line}/></View><View style={styles.items}>{slots.map(slot => { const item = inventoryCatalog[slot.itemId as keyof typeof inventoryCatalog]; if (!item) return null; return <Pressable key={slot.slotId} accessibilityRole="button" accessibilityLabel={`Visualizar ${item.name}`} onPress={() => onSelect(slot)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}><InventoryIcon kind={item.image as never} size={49}/><View style={styles.copy}><Text style={styles.name}>{item.name}</Text><Text numberOfLines={2} style={styles.description}>{item.description}</Text></View></Pressable>; })}</View></View>;
}

const styles = StyleSheet.create({
  wrap: { padding: 13, gap: 12, borderRadius: 21, borderWidth: 1.5, borderColor: 'rgba(229,179,78,.65)', backgroundColor: 'rgba(4,48,37,.90)' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, line: { flex: 1, height: 1, backgroundColor: 'rgba(229,179,78,.42)' }, title: { color: '#FFD875', fontSize: 13, fontWeight: '900', letterSpacing: .5 },
  items: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, item: { flexGrow: 1, flexBasis: 160, minWidth: 145, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(229,179,78,.31)', backgroundColor: 'rgba(2,35,28,.54)' },
  copy: { flex: 1, minWidth: 0, gap: 2 }, name: { color: gameColors.cream, fontWeight: '900', fontSize: 14 }, description: { color: gameColors.muted, fontSize: 10, lineHeight: 13 }, pressed: { opacity: .82, transform: [{ scale: .98 }] },
});

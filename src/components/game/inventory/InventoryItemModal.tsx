import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { InventoryIcon } from '@/assets/game/inventory/InventoryAssets';
import { inventoryCatalog } from '@/config/inventory-catalog';
import type { InventorySlot } from '@/types/game';
import { gameColors } from '@/theme/gameColors';

export function InventoryItemModal({ slot, visible, onClose }: { slot?: InventorySlot; visible: boolean; onClose: () => void }) {
  const activeSlot = slot;
  const item = activeSlot ? inventoryCatalog[activeSlot.itemId as keyof typeof inventoryCatalog] : undefined;
  if (!activeSlot || !item) return null;
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}><View style={styles.backdrop}><Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes" onPress={onClose} style={StyleSheet.absoluteFill}/><View accessibilityViewIsModal style={styles.card}><Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable><View style={styles.iconFrame}><InventoryIcon kind={item.image as never} size={108}/></View><Text selectable style={styles.kicker}>{item.category.toUpperCase()} · {item.rarity.toUpperCase()}</Text><Text selectable style={styles.name}>{item.name}</Text><Text selectable style={styles.amount}>Quantidade disponível: {activeSlot.quantity}</Text><Text selectable style={styles.description}>{item.description}</Text><Pressable accessibilityRole="button" onPress={onClose} style={styles.button}><Text style={styles.buttonText}>FECHAR</Text></Pressable></View></View></Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,19,14,.77)' },
  card: { width: '100%', maxWidth: 380, padding: 22, alignItems: 'center', gap: 8, borderRadius: 25, borderWidth: 2, borderColor: '#E5B34E', backgroundColor: '#063629', boxShadow: '0 12px 28px rgba(0,0,0,.48)' },
  close: { position: 'absolute', right: 12, top: 11, width: 31, height: 31, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,216,117,.65)', alignItems: 'center', justifyContent: 'center' }, closeText: { color: '#FFD875', fontSize: 24, lineHeight: 26 },
  iconFrame: { width: 142, height: 142, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,216,117,.55)', backgroundColor: '#082B22', alignItems: 'center', justifyContent: 'center' },
  kicker: { color: gameColors.gold, fontSize: 10, fontWeight: '900', letterSpacing: .8, marginTop: 5 }, name: { color: gameColors.cream, fontSize: 24, fontWeight: '900' }, amount: { color: gameColors.muted, fontSize: 12, fontWeight: '800' }, description: { alignSelf: 'stretch', color: gameColors.parchment, textAlign: 'center', fontSize: 14, lineHeight: 20, marginVertical: 5 },
  button: { alignSelf: 'stretch', minHeight: 46, borderRadius: 14, backgroundColor: '#E5B34E', alignItems: 'center', justifyContent: 'center', marginTop: 2 }, buttonText: { color: '#06291F', fontWeight: '900', fontSize: 12, letterSpacing: .6 },
});

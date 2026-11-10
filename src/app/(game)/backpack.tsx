import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { GameHomeBackground } from '@/components/game/home/GameHomeBackground';
import { BackpackCapacity } from '@/components/game/inventory/BackpackCapacity';
import { BackpackHeader } from '@/components/game/inventory/BackpackHeader';
import { BackpackIllustration } from '@/components/game/inventory/BackpackIllustration';
import { BackpackStats } from '@/components/game/inventory/BackpackStats';
import { BackpackUpgradePanel } from '@/components/game/inventory/BackpackUpgradePanel';
import { InventoryFilters, type InventoryFilter } from '@/components/game/inventory/InventoryFilters';
import { InventoryGrid } from '@/components/game/inventory/InventoryGrid';
import { InventoryItemDetails } from '@/components/game/inventory/InventoryItemDetails';
import { InventoryItemModal } from '@/components/game/inventory/InventoryItemModal';
import { SpecialItemsPanel } from '@/components/game/inventory/SpecialItemsPanel';
import { inventoryCatalog } from '@/config/inventory-catalog';
import { useAuth } from '@/hooks/use-auth';
import { usePlayerHeader } from '@/hooks/use-player-header';
import { completeBackpackUpgrade, getInventory, initializeInventory, startBackpackUpgrade } from '@/services/inventory/inventory-service';
import { calculateUsedSlots } from '@/services/inventory/inventory-utils';
import type { Inventory, InventorySlot } from '@/types/game';
import { gameColors } from '@/theme/gameColors';

const specialSlots = (inventory: Inventory | null) => (inventory?.keyItems ?? []).map((itemId, index) => ({ slotId: `key-${index}`, itemId, quantity: 1 }));

export default function BackpackScreen() {
  const { user } = useAuth(); const { width } = useWindowDimensions();
  const { coins, tentLevel } = usePlayerHeader();
  const [inventory, setInventory] = useState<Inventory | null>(null); const [selected, setSelected] = useState<InventorySlot | undefined>();
  const [filter, setFilter] = useState<InventoryFilter>('all'); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [now, setNow] = useState(0); const [detailOpen, setDetailOpen] = useState(false);
  const reload = async () => { if (!user) return; const next = await getInventory(user.uid); setInventory(next); };
  useEffect(() => { let alive = true; (async () => { if (!user) return; try { await initializeInventory(); const next = await getInventory(user.uid); if (alive) setInventory(next); } catch { if (alive) setError('Não foi possível carregar a mochila.'); } finally { if (alive) setLoading(false); } })(); return () => { alive = false; }; }, [user]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const used = calculateUsedSlots(inventory?.slots ?? []); const specials = specialSlots(inventory);
  const hasFilteredItems = useMemo(() => filter === 'special' ? specials.length > 0 : filter === 'all' || (inventory?.slots ?? []).some(slot => inventoryCatalog[slot.itemId as keyof typeof inventoryCatalog]?.category === filter), [filter, inventory?.slots, specials.length]);
  const run = async (operation: () => Promise<void>) => { try { setBusy(true); setError(''); await operation(); await reload(); } catch (cause) { setError(cause instanceof Error ? cause.message.replace(/^FirebaseError:\s*/, '') : 'Não foi possível concluir agora.'); } finally { setBusy(false); } };
  const beginUpgrade = () => Alert.alert('Melhorar mochila?', 'A melhoria consome 60 madeiras, 20 fibras naturais e 25 moedas. A Barraca Central deve estar no nível 2.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Iniciar', onPress: () => void run(startBackpackUpgrade) }]);
  const selectItem = (slot: InventorySlot) => { setSelected(slot); };
  const content = inventory ? <>
    <BackpackHeader level={inventory.backpackLevel} used={used} capacity={inventory.capacity} onBack={() => router.replace('/(game)/dashboard')} />
    <View style={[styles.heroPanel, width >= 640 && styles.heroWide]}><BackpackIllustration level={inventory.backpackLevel} /><BackpackStats level={inventory.backpackLevel} used={used} capacity={inventory.capacity} /></View>
    <BackpackCapacity used={used} capacity={inventory.capacity} />
    <View style={[styles.layout, width >= 860 && styles.layoutWide]}>
      <View style={styles.main}>
        <Text style={styles.sectionTitle}>COMPARTIMENTOS DA MOCHILA</Text>
        <InventoryFilters value={filter} onChange={value => { setFilter(value); setSelected(undefined); }} />
        {filter === 'special' ? null : hasFilteredItems ? <InventoryGrid slots={inventory.slots} capacity={inventory.capacity} selectedSlotId={selected?.slotId} filter={filter} onSelect={selectItem} /> : <View style={styles.empty}><Text style={styles.emptyText}>Nenhum item nesta categoria.</Text></View>}
        <SpecialItemsPanel slots={specials} onSelect={selectItem} />
      </View>
      <View style={styles.side}>
        <InventoryItemDetails slot={selected} onVisualize={() => setDetailOpen(true)} />
        <BackpackUpgradePanel inventory={inventory} now={now} coins={coins} tentLevel={tentLevel} disabled={busy} onStart={beginUpgrade} onComplete={() => void run(completeBackpackUpgrade)} />
      </View>
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <InventoryItemModal slot={selected} visible={detailOpen} onClose={() => setDetailOpen(false)} />
  </> : null;
  return <GameHomeBackground><ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{loading ? <Text style={styles.loading}>Organizando sua mochila...</Text> : content}</ScrollView></GameHomeBackground>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 14, paddingTop: 18, paddingBottom: 42, gap: 15 },
  loading: { color: gameColors.cream, textAlign: 'center', marginTop: 110, fontWeight: '800' },
  heroPanel: { gap: 12 }, heroWide: { flexDirection: 'row', alignItems: 'stretch' }, layout: { gap: 15 }, layoutWide: { flexDirection: 'row', alignItems: 'flex-start' }, main: { flex: 1, gap: 14 }, side: { gap: 14, width: '100%', maxWidth: 370 }, sectionTitle: { color: '#FFD875', fontSize: 12, fontWeight: '900', letterSpacing: .9, marginLeft: 3 },
  empty: { padding: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(244,188,63,.28)', borderRadius: 16 }, emptyText: { color: gameColors.muted, textAlign: 'center' }, error: { color: '#FFD1C9', padding: 12, borderRadius: 12, backgroundColor: 'rgba(130,37,29,.55)' },
});

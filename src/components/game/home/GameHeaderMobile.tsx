import { AddButton, BellIcon, CoinGold, GemGreen, LeagueAspirante, MessageIcon, SettingsIcon } from '@/assets/game/header/HeaderAssets';
import { MobileActionFrame, MobileHeaderPanel, MobileResourceFrame } from '@/assets/game/header/mobile/MobileHeaderAssets';
import { usePlayerHeader } from '@/hooks/use-player-header';
import { router } from 'expo-router';
import { Alert, Image, ImageBackground, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

const campBackdrop = require('../../../../assets/images/game/backgrounds/home-forest-mountains.png');
const tent = require('../../../assets/game/tents/tent-level-01-v2.png');
const soon = (name: string) => Alert.alert(name, 'Este recurso será disponibilizado em breve.');
const titleCase = (value: string) => value.slice(0, 1).toUpperCase() + value.slice(1);
const headerEntry = FadeIn.duration(220).reduceMotion(ReduceMotion.System);

function GamePressable({ label, onPress, style, children }: { label: string; onPress: () => void; style?: object; children: React.ReactNode }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} pressRetentionOffset={10} onPress={onPress} style={({ pressed }) => [style, pressed && styles.pressed]}>{children}</Pressable>;
}

function ResourceCounter({ type, value }: { type: 'coins' | 'gems'; value: number }) {
  const isCoin = type === 'coins';
  const label = isCoin ? 'Moedas' : 'Gemas';
  return <View style={styles.resource}><MobileResourceFrame height={38} /><View style={styles.resourceContent}>{isCoin ? <CoinGold size={25} /> : <GemGreen size={25} />}<Text numberOfLines={1} selectable style={styles.amount}>{value.toLocaleString('pt-BR')}</Text><GamePressable label={`Adicionar ${label.toLowerCase()}`} onPress={() => soon(`Adicionar ${label.toLowerCase()}`)} style={styles.add}><AddButton size={27} /></GamePressable></View></View>;
}

function ActionButton({ kind, onPress }: { kind: 'bell' | 'message' | 'settings'; onPress: () => void }) {
  const Icon = kind === 'bell' ? BellIcon : kind === 'message' ? MessageIcon : SettingsIcon;
  const label = kind === 'bell' ? 'Notificações' : kind === 'message' ? 'Mensagens' : 'Configurações';
  return <GamePressable label={label} onPress={onPress} style={styles.action}><MobileActionFrame size={38} /><View pointerEvents="none" style={styles.actionIcon}><Icon size={23} /></View></GamePressable>;
}

/** Compact mobile-only game header. It keeps Firebase data and actions shared with the desktop presentation. */
export function GameHeaderMobile() {
  const { width } = useWindowDimensions();
  const { player, loading, league, coins, gems } = usePlayerHeader();
  const name = loading ? 'Carregando...' : player?.nickname || 'Aventureiro';
  const panelWidth = Math.max(292, width - 28);

  return <View style={styles.wrap}><Animated.View entering={headerEntry} style={styles.panel}><View pointerEvents="none" style={styles.panelBase}/><View pointerEvents="none" style={styles.panelArtwork}><MobileHeaderPanel width={panelWidth} height={205} /></View><View style={styles.resources}><ResourceCounter type="coins" value={coins} /><ResourceCounter type="gems" value={gems} /></View><View style={styles.campWindow}><ImageBackground source={campBackdrop} resizeMode="cover" imageStyle={styles.campBackdrop} style={styles.campBackground}><View pointerEvents="none" style={styles.campShade} /><Image pointerEvents="none" source={tent} resizeMode="contain" style={styles.tentPreview} /></ImageBackground></View><View style={styles.footer}><View style={styles.identity}><Text numberOfLines={1} selectable style={styles.name}>{name}</Text><GamePressable label="Ver ligas" onPress={() => soon('Ligas')} style={styles.league}><LeagueAspirante size={18} /><Text numberOfLines={1} selectable style={styles.leagueText}>{titleCase(league || 'aspirante')}</Text></GamePressable></View><View style={styles.divider} /><View style={styles.actions}><ActionButton kind="bell" onPress={() => soon('Notificações')} /><ActionButton kind="message" onPress={() => soon('Mensagens')} /><ActionButton kind="settings" onPress={() => router.push('/(game)/profile')} /></View></View></Animated.View></View>;
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', paddingTop: 2 },
  panel: { width: '100%', maxWidth: 520, height: 205, position: 'relative', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 8, overflow: 'hidden', borderRadius: 28, backgroundColor: '#063B30', borderWidth: 2, borderColor: '#D9A847', boxShadow: '0 7px 16px rgba(0,0,0,.35)' },
  panelBase: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#063B30' },
  panelArtwork: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', opacity: .98 },
  resources: { height: 38, flexDirection: 'row', gap: 7, zIndex: 1 },
  resource: { height: 38, flex: 1, minWidth: 0, position: 'relative' },
  resourceContent: { position: 'absolute', inset: 0, flexDirection: 'row', alignItems: 'center', paddingLeft: 5, paddingRight: 4, gap: 2 },
  amount: { flex: 1, minWidth: 0, color: '#FFF1CF', fontSize: 15, fontWeight: '900', textAlign: 'right', fontVariant: ['tabular-nums'], textShadowColor: '#021A14', textShadowRadius: 3 },
  add: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center' },
  campWindow: { height: 70, marginTop: 6, overflow: 'hidden', borderRadius: 15, borderWidth: 2, borderColor: '#F5C457', backgroundColor: '#063B30', zIndex: 1 },
  campBackground: { flex: 1, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center' },
  campBackdrop: { borderRadius: 15, transform: [{ scale: 1.14 }] },
  campShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(2, 33, 24, .14)' },
  tentPreview: { width: 87, height: 81, marginBottom: -16, zIndex: 2 },
  footer: { height: 42, marginTop: 4, flexDirection: 'row', alignItems: 'center', minWidth: 0, zIndex: 1 },
  identity: { width: 91, minWidth: 0, gap: 0 },
  name: { color: '#FFF1CF', fontSize: 17, lineHeight: 20, fontWeight: '900', textShadowColor: '#021A14', textShadowRadius: 4 },
  league: { alignSelf: 'flex-start', maxWidth: '100%', minHeight: 20, flexDirection: 'row', alignItems: 'center', gap: 1, paddingRight: 4, borderRadius: 10, borderWidth: 1, borderColor: '#D9A847', backgroundColor: 'rgba(3, 40, 32, .8)' },
  leagueText: { maxWidth: 51, color: '#FFF1CF', fontSize: 10, fontWeight: '800' },
  divider: { width: 1, height: 33, marginLeft: 6, backgroundColor: '#D9A847', opacity: .72 },
  actions: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginLeft: 4 },
  action: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: .82, transform: [{ scale: .96 }] },
});

import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type InventoryArt = 'backpack' | 'wood' | 'stone' | 'fiber' | 'canteen' | 'rope' | 'flashlight' | 'tools' | 'bible' | 'compass';
export function InventoryIcon({ kind, size = 42 }: { kind: InventoryArt; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 64 64' };
  if (kind === 'wood') return <Svg {...common}><Path d="M9 42 45 19l10 15-36 23z" fill="#9A6138" stroke="#F2C07D" strokeWidth="3"/><Path d="m18 37 36-23" stroke="#704126" strokeWidth="3"/></Svg>;
  if (kind === 'stone') return <Svg {...common}><Path d="m12 47 8-24 22-9 14 14-7 22-25 5z" fill="#96A59E" stroke="#E0E7D8" strokeWidth="3"/><Path d="m20 23 11 15 18-10" stroke="#708078" strokeWidth="3" fill="none"/></Svg>;
  if (kind === 'fiber') return <Svg {...common}><Path d="M15 47c0-18 12-31 28-31-1 17-10 30-28 31Z" fill="#B7D46A" stroke="#E9F7AD" strokeWidth="3"/><Path d="M19 44 40 20M25 42l-2-14m8 6 10 1" stroke="#588F45" strokeWidth="3"/></Svg>;
  if (kind === 'canteen') return <Svg {...common}><Rect x="18" y="16" width="28" height="38" rx="8" fill="#5C8DA1" stroke="#D6EEF2" strokeWidth="3"/><Rect x="25" y="9" width="14" height="10" rx="3" fill="#E0BD64"/><Path d="M22 29h20" stroke="#2F5B6F" strokeWidth="4"/></Svg>;
  if (kind === 'rope') return <Svg {...common}><Circle cx="32" cy="32" r="19" fill="none" stroke="#D9AF68" strokeWidth="8"/><Circle cx="32" cy="32" r="10" fill="#173D32"/><Path d="M43 45 55 55" stroke="#D9AF68" strokeWidth="7" strokeLinecap="round"/></Svg>;
  if (kind === 'flashlight') return <Svg {...common}><Path d="m16 48 12-31h14l7 31z" fill="#436371" stroke="#D5EEF1" strokeWidth="3"/><Path d="M24 18h21l5 10H20z" fill="#F4BC3F"/><Circle cx="35" cy="25" r="6" fill="#FFF7B8"/></Svg>;
  if (kind === 'tools') return <Svg {...common}><Path d="m16 14 10 10-5 5-10-10zM39 17l8 8-21 22-8-8z" fill="#B6C4BD" stroke="#F5E9C9" strokeWidth="3"/><Path d="m35 42 13 13" stroke="#A86A35" strokeWidth="7" strokeLinecap="round"/></Svg>;
  if (kind === 'bible') return <Svg {...common}><Path d="M16 13h25c5 0 8 3 8 8v31H24c-5 0-8-3-8-8z" fill="#603D2C" stroke="#E9C96E" strokeWidth="3"/><Path d="M31 22v18m-7-9h14" stroke="#E9C96E" strokeWidth="3"/></Svg>;
  if (kind === 'compass') return <Svg {...common}><Circle cx="32" cy="32" r="22" fill="#D9B65A" stroke="#FFF1B5" strokeWidth="3"/><Circle cx="32" cy="32" r="15" fill="#164B4A"/><Path d="m32 17 7 18-7 12-7-15z" fill="#F0E7C8"/><Path d="m32 17-7 18 7 12z" fill="#E05A4E"/></Svg>;
  return <Svg {...common}><Path d="M15 52V23c0-8 7-14 17-14s17 6 17 14v29z" fill="#4C8159" stroke="#D9B65A" strokeWidth="3"/><Path d="M22 24c0-8 4-12 10-12s10 4 10 12" fill="none" stroke="#D9B65A" strokeWidth="4"/><Rect x="21" y="31" width="22" height="15" rx="4" fill="#2C5B3C"/></Svg>;
}

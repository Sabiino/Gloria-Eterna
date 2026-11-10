import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type SizeProps = { width?: number | string; height?: number | string };

/** Decorative, text-free artwork for the mobile game header. */
export function MobileHeaderPanel({ width = 360, height = 292 }: SizeProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 360 292" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="mobile-panel" x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#11644B" />
          <Stop offset=".48" stopColor="#063B30" />
          <Stop offset="1" stopColor="#032820" />
        </LinearGradient>
        <LinearGradient id="mobile-gold" x1="0" y1="0" x2="0" y2="1">
          <Stop stopColor="#FFF1A6" />
          <Stop offset=".36" stopColor="#F5C457" />
          <Stop offset="1" stopColor="#946118" />
        </LinearGradient>
      </Defs>
      <Rect x="3" y="12" width="354" height="272" rx="32" fill="url(#mobile-panel)" stroke="url(#mobile-gold)" strokeWidth="5" />
      <Rect x="10" y="19" width="340" height="258" rx="26" fill="none" stroke="#FFEBA1" strokeOpacity=".45" strokeWidth="1.5" />
      <Path d="M15 87C57 51 94 89 128 70c31-17 54-44 88-22 35 23 67 6 129-36v102H15Z" fill="#1A7355" opacity=".23" />
      <Path d="M180 138l28-36 17 20 19-30 31 46h-95Zm61 0 19-31 13 19 13-24 26 36h-71Z" fill="#C5E184" opacity=".18" />
      <Path d="M16 245c22-35 38-13 54-45 13 28 28 14 43 45m157 0c12-29 25-18 37-45 16 31 27 14 42 45" fill="none" stroke="#1D7355" strokeWidth="11" opacity=".38" />
      <Path d="M16 258h328" stroke="#F5C457" strokeOpacity=".28" strokeWidth="1" />
      <Path d="M152 284h56l-28 8Z" fill="#F5C457" opacity=".9" />
    </Svg>
  );
}

export function MobileAvatarRing({ size = 82 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 100 100"><Defs><LinearGradient id="avatar-gold" x1="0" y1="0" x2="0" y2="1"><Stop stopColor="#FFF2A3" /><Stop offset=".42" stopColor="#F5C457" /><Stop offset="1" stopColor="#8B5511" /></LinearGradient></Defs><Circle cx="50" cy="50" r="48" fill="url(#avatar-gold)" /><Circle cx="50" cy="50" r="41" fill="#032820" stroke="#FFF1CF" strokeWidth="2" /><Circle cx="50" cy="50" r="37" fill="none" stroke="#0D5B45" strokeWidth="4" /></Svg>;
}

export function MobileResourceFrame({ height = 46 }: { height?: number }) {
  return <Svg width="100%" height={height} viewBox="0 0 160 58" preserveAspectRatio="none"><Defs><LinearGradient id="resource-gold" x1="0" y1="0" x2="0" y2="1"><Stop stopColor="#FFE891" /><Stop offset="1" stopColor="#9B6419" /></LinearGradient></Defs><Rect x="1.5" y="1.5" width="157" height="55" rx="18" fill="#032820" fillOpacity=".91" stroke="url(#resource-gold)" strokeWidth="3" /></Svg>;
}

export function MobileActionFrame({ size = 66 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 66 66"><Defs><LinearGradient id="action-gold" x1="0" y1="0" x2="0" y2="1"><Stop stopColor="#FFE991" /><Stop offset="1" stopColor="#986016" /></LinearGradient></Defs><Rect x="2" y="2" width="62" height="62" rx="20" fill="#073D35" stroke="url(#action-gold)" strokeWidth="3" /><Rect x="7" y="7" width="52" height="52" rx="16" fill="none" stroke="#FFF1CF" strokeOpacity=".18" /></Svg>;
}

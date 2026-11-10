import { isMobileGameHeader } from '@/theme/breakpoints';
import { useWindowDimensions } from 'react-native';
import { GameHeaderDesktop } from './GameHeaderDesktop';
import { GameHeaderMobile } from './GameHeaderMobile';

/** Chooses the game header from the viewport, so mobile web follows the same design as phones. */
export function GameHeader() {
  const { width } = useWindowDimensions();
  return isMobileGameHeader(width) ? <GameHeaderMobile /> : <GameHeaderDesktop />;
}

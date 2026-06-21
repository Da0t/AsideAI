import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/tokens';

interface LogoProps {
  size?: number;
  color?: string;
}

/** The Aside mark — a bold red peak/chevron. Transparent background. */
export default function Logo({ size = 22, color = colors.brand }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path d="M50 12 L94 94 L70 94 L50 52 L30 94 L6 94 Z" fill={color} />
    </Svg>
  );
}

import { Music4, Laugh, Zap, Sparkles } from 'lucide-react-native';

const iconMap: Record<string, typeof Music4> = {
  Music4,
  Laugh,
  Zap,
  Sparkles,
};

interface CueIconProps {
  name: string;
  size?: number;
  color?: string;
}

export default function CueIcon({ name, size = 20, color }: CueIconProps) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} />;
}

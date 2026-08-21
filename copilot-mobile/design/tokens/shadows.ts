import { Platform } from 'react-native';

const shadow = (elevation: number, opacity: number, radius: number, offsetY: number) =>
  Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
  });

export const shadows = {
  level1: shadow(1, 0.04, 1.5, 1),
  level2: shadow(3, 0.07, 3, 2),
  level3: shadow(12, 0.14, 6, 3),
} as const;

export type ShadowToken = keyof typeof shadows;

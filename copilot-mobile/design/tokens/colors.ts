export const colors = {
  neutralBackground1: '#F5F5F5',
  neutralBackground2: '#EBEBEB',
  neutralSurface: '#FFFFFF',
  neutralForeground1: '#1F2937',
  neutralForeground2: '#6B7280',
  neutralForeground3: '#9CA3AF',
  neutralStroke: '#E5E7EB',
  neutralStrokeSubtle: '#D1D5DB',

  brandPrimary: '#193E6B',
  brandPrimaryDark: '#16385F',
  brandSecondary: '#B3A125',
  brandSecondaryDark: '#9F8F20',
  brandTertiary: '#6B9B5B',
  brandTertiaryDark: '#5A8A4A',
  brandForegroundOnPrimary: '#FFFFFF',

  statusDanger: '#EF4444',
  statusWarning: '#F59E0B',
  statusSuccess: '#10B981',

  messageUserBackground: '#FFFFFF',
  messageBotBackground: '#E8E8E0',
  messageActionIcon: '#8B8B7A',
  avatarBackground: '#B8A855',

  overlayBackground: 'rgba(0, 0, 0, 0.5)',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;

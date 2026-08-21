/**
 * Header — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Reduced vertical density for Microsoft-style mobile feel
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Href, useRouter } from 'expo-router';
import FluentIcon from './FluentIcon';
import AppIcon from './AppIcon';
import { colors } from '../design/tokens/colors';
import { spacing } from '../design/tokens/spacing';
import { typography } from '../design/tokens/typography';
import { radius } from '../design/tokens/radius';
import { shadows } from '../design/tokens/shadows';

interface HeaderProps {
  notificationCount?: number;
  onNotificationPress?: () => void;
}

export default function Header({
  notificationCount = 0,
  onNotificationPress,
}: HeaderProps) {
  void notificationCount;
  void onNotificationPress;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.brandPrimary} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Menu button */}
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressedOpacity]}
          onPress={() => router.push('/drawer' as Href)}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <FluentIcon name="menu" size={24} color={colors.neutralSurface} active={false} />
        </Pressable>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <AppIcon size={84} />
          </View>
        </View>

        <View style={styles.iconSpacer} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brandPrimary,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 64,
    ...shadows.level2,
  },
  iconButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  iconSpacer: {
    width: 60,
    height: 60,
  },
  pressedOpacity: {
    opacity: 0.6,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 0,
  },
  logoBox: {
    // Minimal container for logo; let AppIcon size itself
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    // Keep header height stable by constraining logo area
    height: 64,
    minWidth: 140,
    // Nudge left/down a little so logo aligns closer to the menu icon
    marginLeft: -28,
    marginTop: 6,
  },
  logoTop: {
    ...typography.title3,
    color: colors.brandForegroundOnPrimary,
    letterSpacing: 1,
  },
  logoBottom: {
    ...typography.title3,
    color: colors.neutralSurface,
    letterSpacing: 1,
  },
});

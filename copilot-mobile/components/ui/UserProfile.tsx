/**
 * UserProfile — uses FluentIcon (official Microsoft Fluent SVG icons)
 * More icon → size 20 (inline action)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import FluentIcon from '../FluentIcon';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { typography } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';
import { shadows } from '../../design/tokens/shadows';

interface UserProfileProps {
  name: string;
  initials: string;
  onPress?: () => void;
}

export default function UserProfile({ name, initials, onPress }: UserProfileProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      onPress={onPress}
      accessibilityLabel={`User profile: ${name}`}
      accessibilityRole="button"
    >
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>

      <Pressable
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        accessibilityLabel="Profile options"
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <FluentIcon name="moreVertical" size={20} color={colors.neutralForeground2} active={false} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.neutralSurface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    ...shadows.level1,
  },
  containerPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.avatarBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  initials: {
    ...typography.body1Strong,
    color: colors.brandForegroundOnPrimary,
  },
  name: {
    flex: 1,
    ...typography.body1Strong,
    color: colors.brandPrimary,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  iconButtonPressed: {
    opacity: 0.5,
    backgroundColor: colors.neutralBackground2,
  },
});

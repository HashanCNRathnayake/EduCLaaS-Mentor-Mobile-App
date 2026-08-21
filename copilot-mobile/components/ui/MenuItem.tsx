/**
 * MenuItem — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Navigation icons → size 24 (Microsoft Android rule)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import FluentIcon, { FluentIconName } from '../FluentIcon';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { typography } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

interface MenuItemProps {
  icon: FluentIconName;
  label: string;
  onPress?: () => void;
  isActive?: boolean;
}

export default function MenuItem({ icon, label, onPress, isActive = false }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: isActive }}
    >
      {isActive && <View style={styles.indicatorBar} />}
      {/* Navigation icons → size 24. Active: Filled + gold. Inactive: Regular + gray. */}
      <FluentIcon
        name={icon}
        size={24}
        color={isActive ? colors.brandSecondary : colors.neutralForeground2}
        active={isActive}
      />
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: radius.sm,
    minHeight: 48,
    position: 'relative',
  },
  indicatorBar: {
    position: 'absolute',
    left: 0,
    top: '20%',
    height: '60%',
    width: 4,
    backgroundColor: colors.brandSecondary,
    borderRadius: 2,
  },
  containerPressed: {
    opacity: 0.6,
    backgroundColor: colors.neutralBackground2,
  },
  label: {
    ...typography.body1,
    color: colors.neutralForeground2,
    marginLeft: spacing.lg,
  },
  labelActive: {
    ...typography.body1Strong,
    color: colors.brandSecondary,
  },
});

/**
 * RecentItem — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Inline action icons → size 20
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import FluentIcon from '../FluentIcon';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { typography } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

interface RecentItemProps {
  title: string;
  subtitle: string;
  project?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onMore?: () => void;
}

export default function RecentItem({
  title,
  subtitle,
  project,
  onPress,
  onEdit,
  onMore,
}: RecentItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      onPress={onPress}
      accessibilityLabel={`Open ${title}`}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={onEdit}
            accessibilityLabel={`Edit ${title}`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FluentIcon name="edit" size={20} color={colors.neutralForeground2} active={false} />
          </Pressable>
        </View>

        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>

        {project && (
          <View style={styles.projectBadge}>
            <Text style={styles.projectText}>{project}</Text>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        onPress={onMore}
        accessibilityLabel="More options"
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
    paddingVertical: spacing.md,
    alignItems: 'flex-start',
  },
  containerPressed: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    ...typography.body2Strong,
    color: colors.neutralForeground1,
  },
  subtitle: {
    ...typography.caption,
    color: colors.neutralForeground2,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  projectBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutralBackground2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  projectText: {
    ...typography.subtle,
    color: colors.neutralForeground2,
    fontWeight: '500',
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

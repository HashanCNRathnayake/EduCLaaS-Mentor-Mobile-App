/**
 * NoteCard — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Edit icon → size 20 (inline action)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FluentIcon from '../FluentIcon';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { typography } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';
import { shadows } from '../../design/tokens/shadows';

export interface Note {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
}

interface NoteCardProps {
  note: Note;
  onPress?: (note: Note) => void;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const noteDate = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - noteDate.getTime()) / (1000 * 60));
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

export default function NoteCard({ note, onPress, onEdit, onDelete }: NoteCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress?.(note)}
      accessibilityLabel={`Note: ${note.title}`}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {note.title}
        </Text>
        <View style={styles.actionsGroup}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.iconButtonPressed]}
            onPress={() => onEdit?.(note)}
            accessibilityLabel={`Edit ${note.title}`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FluentIcon name="edit" size={20} color={colors.neutralForeground2} active={false} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.iconButtonPressed]}
            onPress={() => onDelete?.(note)}
            accessibilityLabel={`Delete ${note.title}`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.neutralForeground2} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.preview} numberOfLines={2}>
        {note.preview}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.timestamp}>{formatRelativeTime(note.timestamp)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutralSurface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.level1,
  },
  cardPressed: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    ...typography.body1Strong,
    color: colors.neutralForeground1,
    marginRight: spacing.sm,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  iconButtonPressed: {
    opacity: 0.5,
    backgroundColor: colors.neutralBackground2,
  },
  preview: {
    ...typography.body2,
    color: colors.neutralForeground2,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    ...typography.caption,
    color: colors.neutralForeground3,
  },
});

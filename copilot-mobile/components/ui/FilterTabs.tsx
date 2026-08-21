/**
 * FilterTabs — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Add icon → size 20 (inline action)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import FluentIcon from '../FluentIcon';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { typography } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

export interface FilterTab {
  id: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onCreatePress?: () => void;
}

export default function FilterTabs({ tabs, activeTab, onTabChange, onCreatePress }: FilterTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={({ pressed }) => [
                styles.tab,
                isActive && styles.tabActive,
                pressed && !isActive && styles.tabPressed,
              ]}
              onPress={() => onTabChange(tab.id)}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countText, isActive && styles.countTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}

        {onCreatePress && (
          <Pressable
            style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
            onPress={onCreatePress}
            accessibilityLabel="Create new note"
            accessibilityRole="button"
          >
            <Text style={styles.createButtonText}>Create</Text>
            <FluentIcon name="add" size={20} color={colors.brandForegroundOnPrimary} active={false} />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.neutralSurface,
    borderWidth: 1,
    borderColor: colors.neutralStroke,
    gap: spacing.xs,
    minHeight: 44,
  },
  tabActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  tabPressed: {
    opacity: 0.6,
  },
  tabText: {
    ...typography.body2Strong,
    color: colors.neutralForeground2,
  },
  tabTextActive: {
    color: colors.brandForegroundOnPrimary,
  },
  countBadge: {
    backgroundColor: colors.neutralBackground2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    ...typography.subtle,
    fontWeight: '600',
    color: colors.neutralForeground2,
  },
  countTextActive: {
    color: colors.brandForegroundOnPrimary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.brandPrimary,
    gap: spacing.xs,
    minHeight: 44,
  },
  createButtonPressed: {
    opacity: 0.7,
    backgroundColor: colors.brandPrimaryDark,
  },
  createButtonText: {
    ...typography.body2Strong,
    color: colors.brandForegroundOnPrimary,
  },
});

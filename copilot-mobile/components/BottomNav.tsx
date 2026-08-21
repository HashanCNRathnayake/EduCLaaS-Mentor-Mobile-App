 /**
 * BottomNav — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Active tab: Filled icon + brandSecondary. Inactive: Regular + neutralForeground2.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { type Href, useRouter, usePathname } from 'expo-router';
import FluentIcon from './FluentIcon';
import { colors } from '../design/tokens/colors';
import { spacing } from '../design/tokens/spacing';
import { typography } from '../design/tokens/typography';
import { radius } from '../design/tokens/radius';

const tabs = [
  {
    id: 'home',
    label: 'Chat',
    route: '/',
    icon: 'home' as const,
    match: (p: string) => p === '/' || p === '/index',
  },
  {
    id: 'saved-notes',
    label: 'Notes',
    route: '/saved-notes',
    icon: 'document' as const,
    match: (p: string) => p === '/saved-notes',
  },
] as const;

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.match(pathname);
        return (
          <Pressable
            key={tab.id}
            style={({ pressed }) => [
              styles.tabButton,
              pressed && styles.tabButtonPressed,
            ]}
            onPress={() => router.replace(tab.route as Href)}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <FluentIcon
              name={tab.icon}
              size={24}
              color={isActive ? colors.brandSecondary : colors.neutralForeground2}
              active={isActive}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
container: {
  backgroundColor: colors.neutralSurface,
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'flex-start',

  height: 72,

  paddingTop: 8,
  paddingBottom: 0,

  borderTopWidth: 1,
  borderTopColor: colors.neutralStroke,
},

tabButton: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'flex-start',

  height: 56,

  paddingTop: 4,
  paddingBottom: 0,

  borderRadius: radius.sm,

  gap: 4,
},
  tabButtonPressed: {
    opacity: 0.6,
    backgroundColor: colors.neutralBackground2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: typography.caption.lineHeight,
    color: colors.neutralForeground2,
  },
  tabLabelActive: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: typography.caption.lineHeight,
    color: colors.brandSecondary,
  },
});

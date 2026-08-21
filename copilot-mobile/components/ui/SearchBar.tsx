/**
 * SearchBar — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Search icon → size 20 (inline action)
 * Focus: neutralForeground1 icon + border; default: neutralForeground3
 */

import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import FluentIcon from '../FluentIcon';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { typography } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search saved notes',
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <FluentIcon
        name="search"
        size={20}
        color={isFocused ? colors.neutralForeground1 : colors.neutralForeground3}
        active={false}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.neutralForeground3}
        selectionColor={colors.brandPrimary}
        returnKeyType="search"
        accessibilityLabel="Search input"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralBackground2,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.neutralStroke,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    minHeight: 44,
  },
  containerFocused: {
    borderWidth: 2,
    borderColor: colors.neutralForeground1,
    backgroundColor: colors.neutralSurface,
  },
  input: {
    flex: 1,
    ...typography.body1,
    color: colors.neutralForeground1,
    padding: 0,
    minHeight: 36,
  },
});

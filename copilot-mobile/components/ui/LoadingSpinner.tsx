/**
 * LoadingSpinner (Typing Indicator) — Fluent-redesigned
 *
 * Changes from original:
 * - All hex values replaced with design tokens
 * - Spacing via tokens
 * - Radius via tokens
 * - Added bot avatar to match ChatBubble layout
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { typography } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

export default function LoadingSpinner() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, [dot1, dot2, dot3]);

  const animatedStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      {
        translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      {/* Avatar — matches ChatBubble bot avatar */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      </View>

      {/* Typing bubble */}
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, animatedStyle(dot1)]} />
          <Animated.View style={[styles.dot, animatedStyle(dot2)]} />
          <Animated.View style={[styles.dot, animatedStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  avatarWrapper: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.avatarBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.subtle,
    color: colors.brandForegroundOnPrimary,
    fontWeight: '700',
  },
  bubble: {
    backgroundColor: colors.messageBotBackground,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.messageActionIcon,
  },
});

/**
 * MessageInput — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Send icon → size 20 (inline action)
 * Focus: neutralForeground1 border, neutralSurface background
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import FluentIcon from '../FluentIcon';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { typography } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';
import { shadows } from '../../design/tokens/shadows';
import { Config } from '../../constants/Config';

interface MessageInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function MessageInput({
  onSend,
  placeholder = 'Message Mentor',
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const canSend = message.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (canSend) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, isFocused && styles.inputFocused]}
          value={message}
          onChangeText={setMessage}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.neutralForeground3}
          selectionColor={colors.brandPrimary}
          multiline
          maxLength={Config.chat.maxMessageLength}
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          accessibilityLabel="Message input"
          accessibilityHint="Type your message here"
        />

        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
            pressed && canSend && styles.sendButtonPressed,
          ]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <FluentIcon
            name="send"
            size={20}
            color={colors.brandForegroundOnPrimary}
            active={false}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutralSurface,
    borderTopWidth: 1,
    borderTopColor: colors.neutralStroke,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.level2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.neutralBackground2,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.neutralStroke,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body1,
    color: colors.neutralForeground1,
    maxHeight: 100,
    minHeight: 44,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.neutralForeground1,
    backgroundColor: colors.neutralSurface,
  },
  sendButton: {
    backgroundColor: colors.brandTertiary,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.level1,
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutralStrokeSubtle,
    opacity: 0.6,
  },
  sendButtonPressed: {
    backgroundColor: colors.brandTertiaryDark,
    opacity: 0.85,
  },
});

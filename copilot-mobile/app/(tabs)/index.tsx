/**
 * Main Chat Screen — Fluent-redesigned
 *
 * Changes from original:
 * - FlatList is now inverted (messages render bottom-up, no scrollToEnd hack)
 * - Data is reversed before passing to FlatList (inverted pattern)
 * - Background via design token
 * - All other logic unchanged
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import ChatBubble from '@/components/ui/ChatBubble';
import MessageInput from '../../components/ui/MessageInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BottomNav from '../../components/BottomNav';
import { useChat } from '../../hooks/useChat';
import { ensureValidSession, type SessionTokens } from '../../src/auth/api';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { Message } from '../../src/types';

export default function ChatScreen() {
  const router = useRouter();
  const {
    messages,
    isLoading,
    sendMessage,
    saveToNote,
    copyMessage,
    shareMessage,
  } = useChat();
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auth guard — redirect to login if no valid session
  useEffect(() => {
    ensureValidSession().then((session: SessionTokens | null) => {
      if (!session) {
        router.replace('/login');
      }
    }).catch(() => {
      router.replace('/login');
    });
  }, [router]);

  const handleSendMessage = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  const handleQuickReply = useCallback((value: string) => {
    if (isLoading) return;
    sendMessage(value);
  }, [isLoading, sendMessage]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <ChatBubble
        message={item}
        onSaveToNote={saveToNote}
        onCopy={copyMessage}
        onShare={shareMessage}
        onQuickReply={handleQuickReply}
      />
    ),
    [saveToNote, copyMessage, shareMessage, handleQuickReply]
  );

  // For inverted FlatList, prepend the loading indicator as a "first" item
  // by rendering it as ListHeaderComponent (which appears at bottom when inverted)
  const renderHeader = () => {
    if (isLoading) return <LoadingSpinner />;
    return null;
  };

  // Inverted FlatList requires data in reverse order
  const reversedMessages = [...messages].reverse();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Header notificationCount={3} />

        <View style={styles.chatContainer}>
          <FlatList
            data={reversedMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            inverted
            ListHeaderComponent={renderHeader}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          />
        </View>

        <MessageInput onSend={handleSendMessage} disabled={isLoading} />

        {!isKeyboardVisible && <BottomNav />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutralBackground1,
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    // For inverted lists, bottom visual spacing maps to paddingTop.
    // Keep top breathing room while removing the gap above the input bar.
    paddingTop: 0,
    paddingBottom: spacing.lg,
  },
});

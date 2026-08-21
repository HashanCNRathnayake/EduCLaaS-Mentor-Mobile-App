/**
 * NoteDetail Screen — uses FluentIcon (official Microsoft Fluent SVG icons)
 * Navigation icons → size 24
 * Inline actions → size 20
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Text,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FluentIcon from '../components/FluentIcon';
import Header from '../components/Header';
import { createSavedNote, deleteSavedNote, getSavedNoteById, updateSavedNote } from '@/src/notes/storage';
import { colors } from '../design/tokens/colors';
import { spacing } from '../design/tokens/spacing';
import { typography } from '../design/tokens/typography';
import { radius } from '../design/tokens/radius';
import { shadows } from '../design/tokens/shadows';

export default function NoteDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ noteId?: string }>();
  const noteId = typeof params.noteId === 'string' ? params.noteId : undefined;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(!noteId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [titleFocused, setTitleFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);
  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);
  const savedAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!noteId) return;

    getSavedNoteById(noteId)
      .then((note) => {
        if (!note) {
          Alert.alert('Not found', 'This note could not be found.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }

        setTitle(note.title);
        setContent(note.content);
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load note.', [{ text: 'OK', onPress: () => router.back() }]);
      });
  }, [noteId, router]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter note content');
      return;
    }

    setIsSaving(true);
    try {
      if (noteId) {
        const updated = await updateSavedNote(noteId, { title: title.trim(), content: content.trim() });
        if (!updated) {
          throw new Error('Note not found during update');
        }
      } else {
        await createSavedNote(title.trim(), content.trim());
      }
    } catch {
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save note');
      return;
    }

    setIsSaving(false);
    setIsEditing(false);
    setSaveStatus('saved');

    savedAnim.setValue(0);
    Animated.sequence([
      Animated.spring(savedAnim, {
        toValue: 1,
        damping: 14,
        stiffness: 180,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.delay(1100),
      Animated.timing(savedAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSaveStatus('idle');
    });
  };

  const handleEnableEditing = () => {
    setIsEditing(true);
    setSaveStatus('idle');
    setTimeout(() => {
      contentInputRef.current?.focus();
    }, 50);
  };

  const handleBack = () => {
    router.back();
  };

  const handleDelete = () => {
    if (!noteId) return;

    Alert.alert('Delete note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const deleted = await deleteSavedNote(noteId);
            if (!deleted) {
              Alert.alert('Not found', 'This note was already removed.');
              router.back();
              return;
            }
            Alert.alert('Deleted', 'Note removed successfully.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch {
            Alert.alert('Error', 'Failed to delete note.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header notificationCount={3} />

      <View style={styles.toolbar}>
        {/* Navigation icon → size 24 */}
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <FluentIcon name="back" size={24} color={colors.neutralForeground1} active={false} />
        </Pressable>

        <View style={styles.toolbarActions}>
          {!isEditing && noteId && (
            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && styles.iconButtonPressed]}
              onPress={handleDelete}
              accessibilityLabel="Delete note"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.neutralForeground2} />
            </Pressable>
          )}
          {!isEditing && (
            /* Inline action → size 20 */
            <Pressable
              style={({ pressed }) => [styles.editButton, pressed && styles.iconButtonPressed]}
              onPress={handleEnableEditing}
              accessibilityLabel="Edit note"
              accessibilityRole="button"
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          )}
          {isEditing && (
            <Pressable
              style={({ pressed }) => [styles.saveButton, isSaving && styles.saveButtonDisabled, pressed && !isSaving && styles.saveButtonPressed]}
              onPress={handleSave}
              disabled={isSaving}
              accessibilityLabel="Save note"
              accessibilityRole="button"
            >
              {/* Inline action → size 20 */}
              <FluentIcon name="checkmark" size={20} color={colors.brandForegroundOnPrimary} active={false} />
              <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.contentWrap}>
        {saveStatus === 'saved' && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.savedToast,
              {
                opacity: savedAnim,
                transform: [
                  {
                    translateY: savedAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-12, 0],
                    }),
                  },
                  {
                    scale: savedAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <FluentIcon name="checkmark" size={20} color={colors.brandForegroundOnPrimary} active={false} />
            <Text style={styles.savedBannerText}>Saved</Text>
          </Animated.View>
        )}

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            ref={titleInputRef}
            style={[styles.titleInput, titleFocused && styles.inputFocused]}
            value={title}
            onChangeText={setTitle}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            placeholder="Note Title"
            placeholderTextColor={colors.neutralForeground3}
            selectionColor={colors.brandPrimary}
            editable={isEditing}
            multiline
            accessibilityLabel="Note title"
          />

          <TextInput
            ref={contentInputRef}
            style={[styles.contentInput, contentFocused && styles.inputFocused]}
            value={content}
            onChangeText={setContent}
            onFocus={() => setContentFocused(true)}
            onBlur={() => setContentFocused(false)}
            placeholder="Start writing your note..."
            placeholderTextColor={colors.neutralForeground3}
            selectionColor={colors.brandPrimary}
            editable={isEditing}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Note content"
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutralSurface,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralStroke,
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
  toolbarActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
    minHeight: 44,
    ...shadows.level1,
  },
  saveButtonPressed: {
    backgroundColor: colors.brandTertiaryDark,
    opacity: 0.85,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    ...typography.body2Strong,
    color: colors.brandForegroundOnPrimary,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.neutralStroke,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    ...typography.body2Strong,
    color: colors.neutralForeground2,
  },
  contentWrap: {
    flex: 1,
  },
  savedToast: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    zIndex: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.brandTertiary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.level1,
  },
  savedBannerText: {
    ...typography.body2Strong,
    color: colors.brandForegroundOnPrimary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  titleInput: {
    ...typography.title1,
    color: colors.neutralForeground1,
    marginBottom: spacing.lg,
    padding: spacing.md,
    minHeight: 44,
    backgroundColor: colors.neutralBackground2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.neutralStroke,
  },
  contentInput: {
    ...typography.body1,
    color: colors.neutralForeground1,
    minHeight: 300,
    padding: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.neutralBackground2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.neutralStroke,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.neutralForeground1,
    backgroundColor: colors.neutralSurface,
  },
});

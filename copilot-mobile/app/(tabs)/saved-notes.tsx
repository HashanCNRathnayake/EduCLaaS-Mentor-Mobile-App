/**
 * Saved Notes Screen - displays saved notes with filtering and search
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Text,
} from 'react-native';
import Header from '../../components/Header';
import SearchBar from '../../components/ui/SearchBar';
import NoteCard from '../../components/ui/NoteCard';
import BottomNav from '../../components/BottomNav';
import { useNotes } from '@/hooks/useNotes';
import { colors } from '../../design/tokens/colors';
import { spacing } from '../../design/tokens/spacing';
import { typography } from '../../design/tokens/typography';
import type { Note } from '../../components/ui/NoteCard';

export default function SavedNotesScreen() {
  const {
    filteredNotes,
    searchQuery,
    handleSearch,
    handleNotePress,
    handleNoteEdit,
    handleNoteDelete,
  } = useNotes();

  const renderNote = useCallback(
    ({ item }: { item: Note }) => (
      <NoteCard
        note={item}
        onPress={handleNotePress}
        onEdit={handleNoteEdit}
        onDelete={handleNoteDelete}
      />
    ),
    [handleNotePress, handleNoteEdit, handleNoteDelete]
  );

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No saved notes found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Start saving notes from your chats'}
      </Text>
    </View>
  ), [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <Header notificationCount={3} />

      <View style={styles.content}>
        <View style={styles.searchBarWrap}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search saved notes"
          />
        </View>

        <FlatList
          data={filteredNotes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
        />
      </View>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutralBackground1,
  },
  content: {
    flex: 1,
  },
  searchBarWrap: {
    marginTop: spacing.sm,
  },
  notesList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.title3,
    color: colors.neutralForeground2,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.neutralForeground3,
    textAlign: 'center',
  },
});

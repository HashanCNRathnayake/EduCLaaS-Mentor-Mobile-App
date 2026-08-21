import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { deleteSavedNote, getSavedNotes } from '@/src/notes/storage';
import { Note } from '../components/ui/NoteCard';

export interface NotesState {
  notes: Note[];
  filteredNotes: Note[];
  searchQuery: string;
}

export function useNotes() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const loadNotes = useCallback(async () => {
    const stored = await getSavedNotes();
    setNotes(stored);
  }, []);

  useFocusEffect(useCallback(() => {
    loadNotes().catch(() => {
      setNotes([]);
    });
  }, [loadNotes]));

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.preview.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notes, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleNotePress = useCallback((note: Note) => {
    router.push({ pathname: '/note-detail', params: { noteId: note.id } } as Href);
  }, [router]);

  const handleNoteEdit = useCallback((note: Note) => {
    router.push({ pathname: '/note-detail', params: { noteId: note.id } } as Href);
  }, [router]);

  const handleCreateNote = useCallback(() => {
    router.push('/note-detail');
  }, [router]);

  const addNote = useCallback((note: Omit<Note, 'id'>) => {
    void note;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    void id;
    void updates;
  }, []);

  const handleNoteDelete = useCallback((note: Note) => {
    Alert.alert('Delete note', `Remove "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavedNote(note.id);
            await loadNotes();
          } catch {
            Alert.alert('Error', 'Failed to delete note.');
          }
        },
      },
    ]);
  }, [loadNotes]);

  return {
    notes,
    filteredNotes,
    searchQuery,
    handleSearch,
    handleNotePress,
    handleNoteEdit,
    handleCreateNote,
    addNote,
    updateNote,
    handleNoteDelete,
  };
}

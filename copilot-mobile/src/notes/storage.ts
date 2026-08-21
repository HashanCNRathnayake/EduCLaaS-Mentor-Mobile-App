import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY = 'mentor_notes_v1';

export interface SavedNote {
  id: string;
  title: string;
  preview: string;
  content: string;
  timestamp: string;
}

function toTitle(content: string): string {
  const firstLine = content.split(/\r?\n/)[0]?.trim() || '';
  if (!firstLine) return 'Saved message';
  return firstLine.length > 50 ? `${firstLine.slice(0, 47)}...` : firstLine;
}

function toPreview(content: string): string {
  const compact = content.replace(/\s+/g, ' ').trim();
  if (!compact) return 'Saved message';
  return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
}

export async function getSavedNotes(): Promise<SavedNote[]> {
  const raw = await AsyncStorage.getItem(NOTES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as SavedNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveNotes(notes: SavedNote[]): Promise<void> {
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export async function addSavedMessage(content: string): Promise<SavedNote> {
  const existing = await getSavedNotes();

  const note: SavedNote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: toTitle(content),
    preview: toPreview(content),
    content,
    timestamp: new Date().toISOString(),
  };

  await saveNotes([note, ...existing]);
  return note;
}

export async function createSavedNote(title: string, content: string): Promise<SavedNote> {
  const existing = await getSavedNotes();

  const safeContent = content.trim();
  const safeTitle = title.trim() || toTitle(safeContent);

  const note: SavedNote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: safeTitle,
    preview: toPreview(safeContent),
    content: safeContent,
    timestamp: new Date().toISOString(),
  };

  await saveNotes([note, ...existing]);
  return note;
}

export async function updateSavedNote(
  id: string,
  updates: Partial<Pick<SavedNote, 'title' | 'content'>>
): Promise<SavedNote | null> {
  const existing = await getSavedNotes();
  let updatedNote: SavedNote | null = null;

  const next = existing.map((note) => {
    if (note.id !== id) return note;

    const content = updates.content ?? note.content;
    const title = (updates.title ?? note.title).trim() || toTitle(content);

    updatedNote = {
      ...note,
      title,
      content,
      preview: toPreview(content),
      timestamp: new Date().toISOString(),
    };

    return updatedNote;
  });

  await saveNotes(next);
  return updatedNote;
}

export async function getSavedNoteById(id: string): Promise<SavedNote | null> {
  const existing = await getSavedNotes();
  return existing.find((n) => n.id === id) ?? null;
}

export async function deleteSavedNote(id: string): Promise<boolean> {
  const existing = await getSavedNotes();
  const next = existing.filter((n) => n.id !== id);

  if (next.length === existing.length) {
    return false;
  }

  await saveNotes(next);
  return true;
}

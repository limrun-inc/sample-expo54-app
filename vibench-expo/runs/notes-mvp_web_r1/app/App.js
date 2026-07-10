import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PASSWORD = 'my-notes-are-mine';
const STORAGE_KEY = 'notes-app.notes.v1';

function formatTimestamp(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(
    d.getUTCHours()
  )}:${p(d.getUTCMinutes())}`;
}

function deriveTitle(body) {
  const lines = (body || '').split('\n');
  for (const line of lines) {
    if (line.trim().length > 0) return line.trim();
  }
  return 'New Note';
}

function derivePreview(body) {
  const lines = (body || '').split('\n');
  let titleIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length > 0) {
      titleIndex = i;
      break;
    }
  }
  if (titleIndex === -1) return '';
  const rest = lines
    .slice(titleIndex + 1)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return rest.length > 120 ? rest.slice(0, 120) + '…' : rest;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function persistNotes(notes) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    // storage write failed; nothing actionable in-app
  }
}

function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);

  const submit = () => {
    if (value.length === 0) {
      setError('Password is required');
      return;
    }
    if (value !== PASSWORD) {
      setError('Incorrect password');
      return;
    }
    setError(null);
    onUnlock();
  };

  return (
    <View style={styles.gateContainer} testID="password-gate">
      <Text style={styles.gateTitle}>Notes</Text>
      <Text style={styles.gateSubtitle}>Enter your password to unlock</Text>
      <TextInput
        testID="password-input"
        accessibilityLabel="Password"
        style={styles.passwordInput}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        returnKeyType="go"
      />
      {error ? (
        <Text testID="password-error" accessibilityLabel={error} style={styles.errorText}>
          {error}
        </Text>
      ) : null}
      <TouchableOpacity
        testID="unlock-button"
        accessibilityRole="button"
        accessibilityLabel="Unlock"
        style={styles.primaryButton}
        onPress={submit}
      >
        <Text style={styles.primaryButtonText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

function ConfirmDeleteDialog({ visible, onCancel, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard} testID="delete-dialog">
          <Text style={styles.modalTitle}>Delete Note</Text>
          <Text style={styles.modalMessage} testID="delete-dialog-message">
            This note will be permanently deleted. This cannot be undone.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              testID="delete-cancel-button"
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={styles.modalCancelButton}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="delete-confirm-button"
              accessibilityRole="button"
              accessibilityLabel="Delete"
              style={styles.modalDeleteButton}
              onPress={onConfirm}
            >
              <Text style={styles.modalDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function NoteRow({ note, onOpen, onDelete }) {
  return (
    <View style={styles.noteRow} testID={`note-row-${note.id}`}>
      <TouchableOpacity
        style={styles.noteRowMain}
        accessible={false}
        testID={`note-row-open-${note.id}`}
        onPress={() => onOpen(note.id)}
      >
        <Text style={styles.noteTitle} numberOfLines={1} testID={`note-title-${note.id}`}>
          {deriveTitle(note.body)}
        </Text>
        {derivePreview(note.body).length > 0 ? (
          <Text style={styles.notePreview} numberOfLines={1} testID={`note-preview-${note.id}`}>
            {derivePreview(note.body)}
          </Text>
        ) : null}
        <Text style={styles.noteTimestamp} testID={`note-timestamp-${note.id}`}>
          {formatTimestamp(note.updatedAt)}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.rowDeleteButton}
        accessibilityRole="button"
        accessibilityLabel="Delete note"
        testID={`note-delete-${note.id}`}
        onPress={() => onDelete(note.id)}
      >
        <Text style={styles.rowDeleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

function NotesListScreen({ notes, onOpenNote, onNewNote, onDeleteRequest, search, setSearch }) {
  const filtered = useMemo(() => {
    const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (search.length === 0) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (n) =>
        deriveTitle(n.body).toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q)
    );
  }, [notes, search]);

  return (
    <View style={styles.listContainer} testID="notes-list-screen">
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Notes</Text>
        <TouchableOpacity
          testID="new-note-button"
          accessibilityRole="button"
          accessibilityLabel="New Note"
          style={styles.newNoteButton}
          onPress={onNewNote}
        >
          <Text style={styles.newNoteButtonText}>New Note</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        testID="search-input"
        accessibilityLabel="Search notes"
        style={styles.searchInput}
        placeholder="Search"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
        value={search}
        onChangeText={setSearch}
      />
      {filtered.length === 0 ? (
        <View style={styles.emptyState} testID="empty-state">
          <Text style={styles.emptyStateText}>
            {notes.length === 0 ? 'No notes yet. Tap "New Note" to create one.' : 'No notes match your search.'}
          </Text>
        </View>
      ) : (
        <FlatList
          testID="notes-list"
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteRow note={item} onOpen={onOpenNote} onDelete={onDeleteRequest} />
          )}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

function EditorScreen({ note, autoFocusBody, onChangeBody, onBack, onDeleteRequest }) {
  return (
    <View style={styles.editorContainer} testID="editor-screen">
      <View style={styles.editorHeader}>
        <TouchableOpacity
          testID="back-button"
          accessibilityRole="button"
          accessibilityLabel="Back to notes"
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>‹ Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="editor-delete-button"
          accessibilityRole="button"
          accessibilityLabel="Delete note"
          style={styles.rowDeleteButton}
          onPress={() => onDeleteRequest(note.id)}
        >
          <Text style={styles.rowDeleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        testID="note-body-input"
        accessibilityLabel="Note body"
        style={styles.bodyInput}
        multiline
        autoFocus={autoFocusBody}
        textAlignVertical="top"
        placeholder="Start typing…"
        placeholderTextColor="#94a3b8"
        value={note.body}
        onChangeText={onChangeBody}
      />
    </View>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState({ name: 'list' });
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setNotes(parsed);
        }
      } catch (e) {
        // ignore corrupt storage; start fresh
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateNotes = useCallback((updater) => {
    setNotes((prev) => {
      const next = updater(prev);
      persistNotes(next);
      return next;
    });
  }, []);

  const handleNewNote = useCallback(() => {
    const note = { id: makeId(), body: '', updatedAt: Date.now() };
    updateNotes((prev) => [note, ...prev]);
    setScreen({ name: 'editor', id: note.id, isNew: true });
  }, [updateNotes]);

  const handleChangeBody = useCallback(
    (id, text) => {
      updateNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, body: text, updatedAt: Date.now() } : n))
      );
    },
    [updateNotes]
  );

  const handleDeleteRequest = useCallback((id) => {
    setPendingDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    const id = pendingDelete;
    setPendingDelete(null);
    if (!id) return;
    updateNotes((prev) => prev.filter((n) => n.id !== id));
    setScreen((s) => (s.name === 'editor' && s.id === id ? { name: 'list' } : s));
  }, [pendingDelete, updateNotes]);

  const currentNote =
    screen.name === 'editor' ? notes.find((n) => n.id === screen.id) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {!unlocked ? (
        <PasswordGate onUnlock={() => setUnlocked(true)} />
      ) : !loaded ? (
        <View style={styles.gateContainer}>
          <Text style={styles.gateSubtitle}>Loading…</Text>
        </View>
      ) : screen.name === 'editor' && currentNote ? (
        <EditorScreen
          note={currentNote}
          autoFocusBody={!!screen.isNew}
          onChangeBody={(text) => handleChangeBody(currentNote.id, text)}
          onBack={() => setScreen({ name: 'list' })}
          onDeleteRequest={handleDeleteRequest}
        />
      ) : (
        <NotesListScreen
          notes={notes}
          search={search}
          setSearch={setSearch}
          onOpenNote={(id) => setScreen({ name: 'editor', id, isNew: false })}
          onNewNote={handleNewNote}
          onDeleteRequest={handleDeleteRequest}
        />
      )}
      <ConfirmDeleteDialog
        visible={pendingDelete != null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  gateTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#0f172a',
  },
  gateSubtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  newNoteButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newNoteButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#0f172a',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  noteRowMain: {
    flex: 1,
    paddingVertical: 10,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  notePreview: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  noteTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  rowDeleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rowDeleteText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  bodyInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  modalCancelText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  modalDeleteButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalDeleteText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

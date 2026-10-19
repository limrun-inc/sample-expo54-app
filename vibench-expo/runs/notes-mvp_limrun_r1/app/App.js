import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PASSWORD = 'my-notes-are-mine';
const STORAGE_KEY = 'notes:v1';

function formatTimestamp(ms) {
  // Exact format YYYY-MM-DD hh:mm, 24-hour, UTC
  return new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
}

function deriveTitle(body) {
  const lines = (body || '').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed !== '') return trimmed;
  }
  return 'New Note';
}

function derivePreview(body) {
  const lines = (body || '').split('\n');
  let titleFound = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!titleFound) {
      if (trimmed !== '') titleFound = true;
      continue;
    }
    if (trimmed !== '') {
      return trimmed.length > 60 ? trimmed.slice(0, 60) + '…' : trimmed;
    }
  }
  return '';
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [gateError, setGateError] = useState('');

  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState('list'); // 'list' | 'editor'
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteFrom, setDeleteFrom] = useState(null); // 'list' | 'editor'

  const notesRef = useRef(notes);
  notesRef.current = notes;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setNotes(parsed);
        }
      } catch (e) {
        // Corrupt storage: start empty rather than crash.
      }
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback((next) => {
    setNotes(next);
    notesRef.current = next;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const handleUnlock = () => {
    if (password === '') {
      setGateError('Password is required');
      return;
    }
    if (password !== PASSWORD) {
      setGateError('Incorrect password');
      return;
    }
    setGateError('');
    setPassword('');
    setUnlocked(true);
  };

  const openNote = (note) => {
    setActiveNoteId(note.id);
    setDraft(note.body);
    setScreen('editor');
  };

  const createNote = () => {
    const note = { id: makeId(), body: '', updatedAt: Date.now() };
    persist([note, ...notesRef.current]);
    setActiveNoteId(note.id);
    setDraft('');
    setScreen('editor');
  };

  // Save the draft into the active note; bump timestamp only when the body changed.
  const commitDraft = () => {
    const current = notesRef.current;
    const idx = current.findIndex((n) => n.id === activeNoteId);
    if (idx === -1) return;
    if (current[idx].body === draft) return;
    const next = current.slice();
    next[idx] = { ...next[idx], body: draft, updatedAt: Date.now() };
    persist(next);
  };

  const goBackToList = () => {
    commitDraft();
    setScreen('list');
    setActiveNoteId(null);
  };

  const requestDelete = (id, from) => {
    setDeleteTargetId(id);
    setDeleteFrom(from);
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
    setDeleteFrom(null);
  };

  const confirmDelete = () => {
    const id = deleteTargetId;
    const from = deleteFrom;
    setDeleteTargetId(null);
    setDeleteFrom(null);
    persist(notesRef.current.filter((n) => n.id !== id));
    if (from === 'editor') {
      setScreen('list');
      setActiveNoteId(null);
    }
  };

  if (!unlocked) {
    return (
      <View style={styles.gateContainer} testID="password-gate">
        <StatusBar style="auto" />
        <Text style={styles.gateTitle} testID="gate-title">
          Notes
        </Text>
        <Text style={styles.gateSubtitle}>Enter password to unlock</Text>
        <TextInput
          style={styles.passwordInput}
          testID="password-input"
          accessibilityLabel="Password"
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (gateError) setGateError('');
          }}
          onSubmitEditing={handleUnlock}
          returnKeyType="go"
        />
        {gateError !== '' && (
          <Text style={styles.errorText} testID="password-error" accessibilityLabel={gateError}>
            {gateError}
          </Text>
        )}
        <Pressable
          style={styles.primaryButton}
          testID="unlock-button"
          accessibilityRole="button"
          accessibilityLabel="Unlock"
          onPress={handleUnlock}
        >
          <Text style={styles.primaryButtonText}>Unlock</Text>
        </Pressable>
      </View>
    );
  }

  if (screen === 'editor') {
    return (
      <View style={styles.screen} testID="editor-screen">
        <StatusBar style="auto" />
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            testID="back-button"
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={goBackToList}
          >
            <Text style={styles.headerButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Note</Text>
          <Pressable
            style={styles.headerButton}
            testID="editor-delete-button"
            accessibilityRole="button"
            accessibilityLabel="Delete note"
            onPress={() => requestDelete(activeNoteId, 'editor')}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.bodyInput}
          testID="note-body-input"
          accessibilityLabel="Note body"
          multiline
          autoFocus
          textAlignVertical="top"
          placeholder="Start typing…"
          value={draft}
          onChangeText={setDraft}
        />
        <DeleteConfirmModal
          visible={deleteTargetId !== null}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      </View>
    );
  }

  const sorted = notes.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  const q = query.trim().toLowerCase();
  const visible =
    q === ''
      ? sorted
      : sorted.filter((n) => {
          const title = deriveTitle(n.body).toLowerCase();
          return title.includes(q) || n.body.toLowerCase().includes(q);
        });

  return (
    <View style={styles.screen} testID="notes-list-screen">
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
        <Pressable
          style={styles.primaryButtonSmall}
          testID="new-note-button"
          accessibilityRole="button"
          accessibilityLabel="New Note"
          onPress={createNote}
        >
          <Text style={styles.primaryButtonText}>New Note</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.searchInput}
        testID="search-input"
        accessibilityLabel="Search notes"
        placeholder="Search"
        autoCapitalize="none"
        autoCorrect={false}
        value={query}
        onChangeText={setQuery}
      />
      {loaded && visible.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText} testID="empty-state">
            {q === '' ? 'No notes yet. Tap "New Note" to create one.' : 'No notes match your search.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NoteRow
              note={item}
              onOpen={() => openNote(item)}
              onDelete={() => requestDelete(item.id, 'list')}
            />
          )}
        />
      )}
      <DeleteConfirmModal
        visible={deleteTargetId !== null}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

function NoteRow({ note, onOpen, onDelete }) {
  const title = deriveTitle(note.body);
  const preview = derivePreview(note.body);
  return (
    <View style={styles.row} testID={`note-row-${note.id}`}>
      <Pressable style={styles.rowMain} accessible={false} onPress={onOpen} testID={`note-open-${note.id}`}>
        <Text style={styles.rowTitle} numberOfLines={1} testID={`note-title-${note.id}`} accessibilityLabel={title}>
          {title}
        </Text>
        {preview !== '' && (
          <Text style={styles.rowPreview} numberOfLines={1} testID={`note-preview-${note.id}`} accessibilityLabel={preview}>
            {preview}
          </Text>
        )}
        <Text style={styles.rowTimestamp} testID={`note-timestamp-${note.id}`} accessibilityLabel={formatTimestamp(note.updatedAt)}>
          {formatTimestamp(note.updatedAt)}
        </Text>
      </Pressable>
      <Pressable
        style={styles.rowDelete}
        testID={`note-delete-${note.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${title}`}
        onPress={onDelete}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    </View>
  );
}

function DeleteConfirmModal({ visible, onCancel, onConfirm }) {
  if (!visible) return null;
  // Rendered as an in-tree absolute overlay (not a native Modal) so the
  // dialog is always reachable through the iOS accessibility tree.
  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard} testID="delete-confirm-dialog">
          <Text style={styles.modalTitle} testID="delete-confirm-title">
            Delete Note?
          </Text>
          <Text style={styles.modalMessage} testID="delete-confirm-message">
            This note will be permanently deleted. This cannot be undone.
          </Text>
          <View style={styles.modalButtons}>
            <Pressable
              style={styles.modalCancelButton}
              testID="delete-cancel-button"
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.modalDeleteButton}
              testID="delete-confirm-button"
              accessibilityRole="button"
              accessibilityLabel="Delete"
              onPress={onConfirm}
            >
              <Text style={styles.modalDeleteText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gateContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    padding: 24,
  },
  gateTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
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
  primaryButtonSmall: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#dc2626',
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
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  rowMain: {
    flex: 1,
    paddingVertical: 10,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowPreview: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 2,
  },
  rowTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
  },
  rowDelete: {
    paddingVertical: 10,
    paddingLeft: 12,
  },
  bodyInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalDeleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  modalDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

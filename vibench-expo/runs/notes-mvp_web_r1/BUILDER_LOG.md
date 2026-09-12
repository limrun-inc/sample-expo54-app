# Builder Log — notes-mvp_web_r1 (condition: web)

## Setup

- Read protocol (`harness/builder-web.md`) and PRD (`tasks/notes/prd/mvp.txt`).
- Implemented the whole app in `app/App.js` (single file, no new dependencies):
  - Password gate (fixed password `my-notes-are-mine`, masked input, Unlock button + keyboard submit, "Password is required" / "Incorrect password" errors). Unlock state is in-memory only, so cold launch always re-locks; backgrounding does not.
  - Notes list: title = first non-empty line (trimmed) or "New Note" placeholder; single-line preview from the text after the title line; timestamp `YYYY-MM-DD hh:mm` in 24-hour UTC; sorted by last-edited descending.
  - Editor: single multiline TextInput, autoFocus on newly created notes, back button, delete button.
  - Autosave: notes are saved to AsyncStorage on every keystroke (superset of "save on navigate away"), timestamp updated on each change.
  - Search: case-insensitive substring match on title or body, live filter, sort order preserved, empty query shows all.
  - Delete: from list row and from editor; custom `Modal` confirmation dialog (chosen over `Alert.alert` so it renders identically on web and is fully in the accessibility tree) with permanent-deletion messaging; delete from editor navigates back to list.
  - testIDs everywhere: `password-input`, `password-error`, `unlock-button`, `notes-list-screen`, `search-input`, `new-note-button`, `note-row-open-<id>`, `note-title-<id>`, `note-preview-<id>`, `note-timestamp-<id>`, `note-delete-<id>`, `editor-screen`, `note-body-input`, `back-button`, `editor-delete-button`, `delete-dialog`, `delete-dialog-message`, `delete-confirm-button`, `delete-cancel-button`, `empty-state`.
- Started `npx expo start --web --port 8095` and headless Chrome (CDP :9223) in tmux session `web-builder-notes`.
- Wrote a small CDP driver (`drive.js`, uses the app's `ws` module) with goto/click/type/text helpers keyed off `data-testid`.

## Iteration 1 — scenario1 (gate + create + list row)

Checked: gate shown on load with no note data; empty submit -> "Password is required"; wrong password -> "Incorrect password" and stays on gate; correct password -> list with empty state; New Note opens editor with body focused; typed a body whose first line is whitespace (`"  \nGrocery List\nMilk and eggs\nBread"`); back to list shows title "Grocery List", preview "Milk and eggs Bread", timestamp `2026-07-10 21:30` matching the current UTC minute and the exact `YYYY-MM-DD hh:mm` format; note present in AsyncStorage/localStorage.

Result: all passed on first run (one driver-only fix: clear localStorage after navigating, not on about:blank).

## Iteration 2 — scenario2 (relaunch, sort, search, delete)

Checked: page reload (≈ relaunch) re-locks and shows no note data; note persists after unlock; second note sorts to top; editing the older note moves it to top; search "ROADMAP" matches body case-insensitively; "grocery" matches title; no-match shows "No notes match your search."; empty query restores all; empty note lists as "New Note"; list-row delete shows confirmation dialog with permanent-deletion message; Cancel keeps the note; Confirm removes it; delete from editor navigates back to list and removes the note; deletions persist across relaunch.

Result: all passed. No app changes needed.

## Iteration 3 — accessibility tweak + scenario3

Change: set `accessible={false}` on the note-row TouchableOpacity so the title, preview, and timestamp Text nodes are exposed individually in the iOS accessibility tree instead of being collapsed into one container element (PRD requires key informational text to be reachable).

Checked after the change: keyboard-submit (Enter) unlocks; note rows still open the editor on tap; line breaks preserved in the editor value; typing mid-edit then reloading without navigating back still persists the text (autosave-on-keystroke guarantees text visible at navigation time is saved).

Result: all passed.

## Iteration 4 — screenshots

Captured `shot-gate.png` and `shot-list.png`; both screens render correctly (gate with masked field + Unlock; list with header, New Note button, search field, note row with title/preview/timestamp/Delete).

## iOS-vs-web reasoning (not observable on web)

- Used a custom RN `Modal` for delete confirmation instead of `Alert.alert` so behavior is identical on both platforms and dialog text/buttons carry testIDs.
- Timestamps use `getUTC*` accessors, so simulator timezone does not matter.
- `SafeAreaView` used as root so controls are not under the notch.
- Unlock state is plain React state (never persisted), so app termination re-locks; `AppState` background/foreground does not touch it.
- Persistence via `@react-native-async-storage/async-storage` (native storage on iOS, localStorage on web).
- Saving on every keystroke sidesteps iOS-specific blur/unmount timing differences for autosave.

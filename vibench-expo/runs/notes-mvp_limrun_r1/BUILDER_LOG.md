# BUILDER_LOG — notes-mvp_limrun_r1 (condition: limrun)

Simulator: `ios_useb_01kx6v41trebt9r6jpaz5wnj45`, dev client `com.vibench.expobench` (prebuilt, no native changes).
Metro: `npx expo start --dev-client --tunnel --port 8091` in tmux session `limrun-builder-notes`; tunnel `https://qjs1kbe-anonymous-8091.exp.direct` worked on the first try (no `lim ios reverse` fallback needed).

## Iteration 1 — full implementation in App.js

Implemented the whole PRD in a single `App.js` (no new native deps):

- Password gate (`my-notes-are-mine`), masked field, Unlock button + keyboard submit, errors "Password is required" / "Incorrect password", unlock state in memory only (re-locks on relaunch).
- Notes list: title = first non-empty trimmed line (placeholder "New Note"), preview = first non-empty line after the title line (truncated at 60 chars with ellipsis), timestamp `YYYY-MM-DD hh:mm` UTC via `toISOString()`, sorted by `updatedAt` desc.
- Editor: multiline autofocused TextInput, autosave on Back (timestamp bumps only when body changed), New Note creates an empty persisted note and opens the editor.
- Search: case-insensitive substring over derived title OR body, live filtering, sort preserved, empty-query shows all.
- Delete: from list rows and from editor, confirmation dialog with permanent-deletion messaging, editor delete navigates back to list.
- Persistence: AsyncStorage key `notes:v1`, written on every mutation.
- testIDs/accessibilityLabels on all interactive controls and key text.

Verified on the simulator (element-tree driven):

- Connected dev client to tunnel, confirmed the password gate rendered (our app, not a stale one).
- Empty submit → "Password is required"; typed `wrong-pass` → "Incorrect password", still on gate; cleared field (10× delete key), typed correct password, Unlock → empty-state list.
- New Note → editor autofocused. Learned that `lim ios type`/`typeText` REPLACES the field value (pressing enter between two typeText calls does not concatenate), so multi-line bodies were set via `lim ios perform --file` with `\n` inside a single typeText action.
- Multi-line body "Groceries\nmilk and eggs from the store\nbread too" → back → row shows title "Groceries", preview "milk and eggs from the store", timestamp `2026-07-10 21:42` (UTC, correct format).
- Empty note shows "New Note" placeholder, no preview, valid + listed; sorted first (most recent).
- Edited Groceries note (added "apples") → re-sorted to top: sort-by-last-edit desc confirmed.
- Search "MILK" → only Groceries row (case-insensitive body match, empty note filtered out); "zzz" → "No notes match your search."; cleared query → both rows back.

## Iteration 2 — fix: delete dialog not in accessibility tree

Found: the native RN `<Modal>` delete confirmation rendered visually (screenshot confirmed) but `lim ios element-tree` intermittently returned an almost-empty tree while the modal window was up — first open exposed it, subsequent opens did not. That would make delete untestable by the grader.

Fix: replaced `<Modal>` with an in-tree absolutely-positioned overlay (`StyleSheet.absoluteFillObject`, zIndex 10) rendered inside the screen view.

Verified after fix (hot reload required an app relaunch since the old modal was stuck; relaunch also exercised the lifecycle path):

- Cold relaunch (`terminate-app` + reopen dev-client URL) → gate shown, NO note data in the element tree before unlock; unlock → both notes still present (persistence OK).
- Delete dialog now always in the tree: title "Delete Note?", message "This note will be permanently deleted. This cannot be undone.", `delete-cancel-button`, `delete-confirm-button`.
- Cancel → note remains. Confirm from list → empty note removed immediately.
- Delete from editor: created "Temp note to delete" (typed with no prior tap — confirms editor autofocus), Delete → confirm → navigated back to list, note gone.
- Second cold relaunch: gate again (re-lock), no note data pre-unlock; unlocked via keyboard submit (enter) this time; Groceries note present with full 4-line body `Groceries\nmilk and eggs from the store\nbread too\napples` (line breaks preserved), deleted notes gone.

## Wrap-up

Killed tmux session `limrun-builder-notes` (Metro) after final verification; simulator left running.

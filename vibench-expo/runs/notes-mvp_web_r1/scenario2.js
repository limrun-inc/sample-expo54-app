// Scenario 2: relaunch re-lock + persistence, sorting, search, empty note, delete flows
module.exports = async (run) => {
  const log = (...a) => console.log(...a);
  const unlock = async () => {
    await run.type('password-input', 'my-notes-are-mine');
    await run.click('unlock-button');
    await run.sleep(300);
  };
  const rowTitles = async () => {
    return run.eval(`Array.from(document.querySelectorAll('[data-testid^="note-title-"]')).map(e=>e.textContent)`);
  };

  // Reload = relaunch: must re-lock, no note data visible
  await run.goto('http://localhost:8095/');
  log('re-locked after reload:', await run.exists('password-gate'));
  const body = await run.bodyText();
  log('no note data on gate:', !body.includes('Grocery List'));
  await unlock();
  log('note persisted across relaunch:', (await rowTitles()).includes('Grocery List'));

  // Create second note
  await run.click('new-note-button');
  await run.type('note-body-input', 'Meeting notes\nDiscuss Q3 roadmap');
  await run.click('back-button');
  await run.sleep(200);
  log('sort order (newest first):', await rowTitles());

  // Edit older note -> should move to top
  const ids = await run.testIds();
  const groceryOpen = await run.eval(`(() => {
    const els = Array.from(document.querySelectorAll('[data-testid^="note-title-"]'));
    const el = els.find(e => e.textContent === 'Grocery List');
    return el ? el.getAttribute('data-testid').replace('note-title-','') : null;
  })()`);
  await run.click(`note-row-open-${groceryOpen}`);
  await run.type('note-body-input', 'Grocery List\nMilk and eggs\nBread\nCheese');
  await run.click('back-button');
  await run.sleep(200);
  log('after edit, order:', await rowTitles());

  // Search: case-insensitive substring, title or body
  await run.type('search-input', 'ROADMAP');
  await run.sleep(200);
  log('search ROADMAP (body match):', await rowTitles());
  await run.type('search-input', 'grocery');
  await run.sleep(200);
  log('search grocery (title match):', await rowTitles());
  await run.type('search-input', 'zzz-nomatch');
  await run.sleep(200);
  log('no-match state:', await run.text('empty-state'));
  await run.type('search-input', '');
  await run.sleep(200);
  log('empty query shows all:', await rowTitles());

  // Empty note placeholder
  await run.click('new-note-button');
  await run.click('back-button');
  await run.sleep(200);
  log('with empty note:', await rowTitles());

  // Delete from list: cancel then confirm
  const emptyNoteId = await run.eval(`(() => {
    const els = Array.from(document.querySelectorAll('[data-testid^="note-title-"]'));
    const el = els.find(e => e.textContent === 'New Note');
    return el ? el.getAttribute('data-testid').replace('note-title-','') : null;
  })()`);
  await run.click(`note-delete-${emptyNoteId}`);
  log('dialog shown:', await run.exists('delete-dialog'), '| msg:', await run.text('delete-dialog-message'));
  await run.click('delete-cancel-button');
  await run.sleep(200);
  log('after cancel, still listed:', (await rowTitles()).includes('New Note'));
  await run.click(`note-delete-${emptyNoteId}`);
  await run.click('delete-confirm-button');
  await run.sleep(200);
  log('after confirm, removed:', !(await rowTitles()).includes('New Note'));

  // Delete from editor
  const meetingId = await run.eval(`(() => {
    const els = Array.from(document.querySelectorAll('[data-testid^="note-title-"]'));
    const el = els.find(e => e.textContent === 'Meeting notes');
    return el ? el.getAttribute('data-testid').replace('note-title-','') : null;
  })()`);
  await run.click(`note-row-open-${meetingId}`);
  await run.click('editor-delete-button');
  await run.click('delete-confirm-button');
  await run.sleep(300);
  log('navigated back to list:', await run.exists('notes-list-screen'));
  log('meeting note removed:', !(await rowTitles()).includes('Meeting notes'));

  // Deletion persists across relaunch
  await run.goto('http://localhost:8095/');
  await unlock();
  log('final notes after relaunch:', await rowTitles());
};

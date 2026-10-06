// Scenario 1: gate validation, unlock, empty state, create note, list row fields
module.exports = async (run) => {
  const log = (...a) => console.log(...a);
  await run.goto('http://localhost:8095/');
  await run.eval(`localStorage.clear()`);
  await run.goto('http://localhost:8095/');
  log('gate visible:', await run.exists('password-gate'));
  log('note data hidden pre-unlock:', !(await run.exists('notes-list-screen')));

  // Empty submit
  await run.click('unlock-button');
  log('empty error:', await run.text('password-error'));

  // Wrong password
  await run.type('password-input', 'wrong-pass');
  await run.click('unlock-button');
  log('wrong error:', await run.text('password-error'));
  log('still on gate:', await run.exists('password-gate'));

  // Correct password
  await run.type('password-input', 'my-notes-are-mine');
  await run.click('unlock-button');
  await run.sleep(300);
  log('list visible:', await run.exists('notes-list-screen'));
  log('empty state:', await run.text('empty-state'));

  // Create a note
  await run.click('new-note-button');
  log('editor visible:', await run.exists('editor-screen'));
  log('body input focused:', await run.eval(
    `document.activeElement === document.querySelector('[data-testid="note-body-input"]')`
  ));
  await run.type('note-body-input', '  \nGrocery List\nMilk and eggs\nBread');
  await run.click('back-button');
  await run.sleep(300);
  log('back on list:', await run.exists('notes-list-screen'));
  const ids = await run.testIds();
  const titleId = ids.find((i) => i.startsWith('note-title-'));
  const previewId = ids.find((i) => i.startsWith('note-preview-'));
  const tsId = ids.find((i) => i.startsWith('note-timestamp-'));
  log('title:', JSON.stringify(await run.text(titleId)));
  log('preview:', JSON.stringify(await run.text(previewId)));
  const ts = await run.text(tsId);
  log('timestamp:', JSON.stringify(ts), 'format ok:', /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(ts));
  const nowUtc = new Date().toISOString().slice(0, 16).replace('T', ' ');
  log('timestamp matches current UTC minute:', ts === nowUtc, '(now:', nowUtc + ')');

  // Persistence in storage
  log('storage has note:', await run.eval(
    `(localStorage.getItem('notes-app.notes.v1')||'').includes('Grocery List')`
  ));
};

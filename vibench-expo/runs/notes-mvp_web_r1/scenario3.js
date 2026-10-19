// Scenario 3: after accessible=false change — rows still tappable; Enter-key unlock;
// mid-edit termination persistence; line breaks preserved.
module.exports = async (run) => {
  const log = (...a) => console.log(...a);
  const rowTitles = () =>
    run.eval(`Array.from(document.querySelectorAll('[data-testid^="note-title-"]')).map(e=>e.textContent)`);

  await run.goto('http://localhost:8095/');
  // Enter-key unlock (keyboard submit)
  await run.type('password-input', 'my-notes-are-mine');
  await run.eval(`(() => {
    const el = document.querySelector('[data-testid="password-input"]');
    el.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
  })()`);
  await run.sleep(400);
  log('unlocked via Enter:', await run.exists('notes-list-screen'));

  // Row tap still opens editor
  const titles = await rowTitles();
  log('rows:', titles);
  const id = await run.eval(`(() => {
    const el = document.querySelector('[data-testid^="note-title-"]');
    return el ? el.getAttribute('data-testid').replace('note-title-','') : null;
  })()`);
  await run.click(`note-row-open-${id}`);
  log('row tap opens editor:', await run.exists('editor-screen'));
  const bodyVal = await run.eval(`document.querySelector('[data-testid="note-body-input"]').value`);
  log('line breaks preserved in editor:', JSON.stringify(bodyVal));

  // Mid-edit "termination": type, then reload without navigating back
  await run.type('note-body-input', 'Grocery List\nMilk and eggs\nBread\nCheese\nAPPLES-MIDEDIT');
  await run.goto('http://localhost:8095/');
  await run.type('password-input', 'my-notes-are-mine');
  await run.click('unlock-button');
  await run.sleep(300);
  log('mid-edit text persisted:', (await run.bodyText()).includes('APPLES-MIDEDIT'));
};

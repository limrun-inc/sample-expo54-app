// Scenario 4: screenshots of gate and list
const fs = require('fs');
module.exports = async (run) => {
  await run.goto('http://localhost:8095/');
  let shot = await run.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/workspace/vibench-expo/runs/notes-mvp_web_r1/shot-gate.png',
    Buffer.from(shot.result.data, 'base64'));
  await run.type('password-input', 'my-notes-are-mine');
  await run.click('unlock-button');
  await run.sleep(400);
  shot = await run.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/workspace/vibench-expo/runs/notes-mvp_web_r1/shot-list.png',
    Buffer.from(shot.result.data, 'base64'));
  console.log('screenshots saved');
};

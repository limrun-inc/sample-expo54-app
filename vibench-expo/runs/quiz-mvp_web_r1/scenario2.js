const QUESTIONS = require('./app/assets/questions.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async ({ evaluate, navigate }) => {
  const results = [];
  const check = (name, cond, extra = '') =>
    results.push(`${cond ? 'PASS' : 'FAIL'}: ${name}${extra ? ' | ' + extra : ''}`);

  await navigate('http://localhost:8095');
  await sleep(2000);
  await evaluate(`
    window.$t = (tid) => document.querySelector('[data-testid="' + tid + '"]');
    window.$text = (tid) => { const el = window.$t(tid); return el ? el.innerText : null; };
    window.$click = (tid) => {
      const el = window.$t(tid);
      if (!el) return false;
      el.scrollIntoView({block: 'center'});
      const r = el.getBoundingClientRect();
      const opts = {bubbles: true, cancelable: true, clientX: r.x + r.width/2, clientY: r.y + r.height/2, button: 0};
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));
      return true;
    };
    true;
  `);

  const answerCurrent = async (correct) => {
    const qText = await evaluate(`window.$text('question-text')`);
    const q = QUESTIONS.find((x) => x.question === qText);
    if (!q) throw new Error('question not found: ' + qText);
    const opt = correct
      ? q.correct_option
      : ['A', 'B', 'C', 'D'].find((k) => k !== q.correct_option);
    await evaluate(`window.$click('option-${opt}')`);
    await sleep(250);
    return { q, opt };
  };

  // Science quiz (12 questions, samples 10)
  await evaluate(`window.$click('category-Science')`);
  await sleep(400);
  const progress = await evaluate(`window.$text('progress-indicator')`);
  check('science quiz Q1 of 10', progress === 'Question 1 of 10', progress);

  // Pattern: wrong, 5 correct, wrong, wrong, wrong, wrong => max streak 5
  const pattern = [false, true, true, true, true, true, false, false, false, false];
  for (let i = 0; i < 10; i++) {
    const { q, opt } = await answerCurrent(pattern[i]);
    if (i === 0) {
      // answer locking: try clicking another (correct) option after answering wrong
      const fbBefore = await evaluate(`window.$text('feedback-text')`);
      await evaluate(`window.$click('option-${q.correct_option}')`);
      await sleep(250);
      const fbAfter = await evaluate(`window.$text('feedback-text')`);
      check('answer locked after submit', fbBefore === 'Incorrect' && fbAfter === 'Incorrect', `${fbBefore}/${fbAfter}`);
      const bgSel = await evaluate(`getComputedStyle(window.$t('option-${opt}')).backgroundColor`);
      check('selected wrong option stays red', bgSel === 'rgb(254, 226, 226)', bgSel);
    }
    await evaluate(`window.$click('next-button')`);
    await sleep(250);
  }
  const score = await evaluate(`window.$text('score-text')`);
  check('score 5/10 (50%)', score === '5/10 Correct (50%)', score);
  const body = await evaluate('document.body.innerText');
  check('Hot Streak earned (max streak 5)', body.includes('Hot Streak'));
  check('Triple Win earned', body.includes('Triple Win'));
  check('no Perfect Round', !body.includes('Perfect Round'));

  console.log(results.join('\n'));
  const fails = results.filter((r) => r.startsWith('FAIL'));
  console.log(`\n${results.length - fails.length}/${results.length} checks passed`);
};

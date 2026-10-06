const QUESTIONS = require('./app/assets/questions.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async ({ evaluate, navigate }) => {
  const results = [];
  const check = (name, cond, extra = '') => {
    results.push(`${cond ? 'PASS' : 'FAIL'}: ${name}${extra ? ' | ' + extra : ''}`);
  };

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

  // --- Category screen ---
  const bodyText = await evaluate('document.body.innerText');
  const cats = [...new Set(QUESTIONS.map((q) => q.category))];
  const missing = cats.filter((c) => !bodyText.includes(c));
  check('all categories listed', missing.length === 0, missing.join(','));
  check('Surprise Me listed', bodyText.includes('Surprise Me!'));

  // --- Geography quiz, all correct ---
  check('click Geography', await evaluate(`window.$click('category-Geography')`));
  await sleep(400);
  let progress = await evaluate(`window.$text('progress-indicator')`);
  check('geo goes straight to quiz Q1 of 10', progress === 'Question 1 of 10', progress);

  const answerCurrent = async (correct) => {
    const qText = await evaluate(`window.$text('question-text')`);
    const q = QUESTIONS.find((x) => x.question === qText);
    if (!q) throw new Error('question not found in data: ' + qText);
    let opt;
    if (correct) opt = q.correct_option;
    else opt = ['A', 'B', 'C', 'D'].find((k) => k !== q.correct_option);
    await evaluate(`window.$click('option-${opt}')`);
    await sleep(250);
    return q;
  };

  const seenQuestions = new Set();
  for (let i = 0; i < 10; i++) {
    const q = await answerCurrent(true);
    seenQuestions.add(q.id);
    if (i === 0) {
      const fb = await evaluate(`window.$text('feedback-text')`);
      check('feedback Correct!', fb === 'Correct!', fb);
      const expl = await evaluate(`window.$text('explanation-text')`);
      check('explanation shown', expl === q.explanation);
      check('all geo questions are Geography', q.category === 'Geography');
    }
    const nextLabel = await evaluate(`window.$text('next-button')`);
    if (i < 9) {
      check(`next button label Q${i + 1}`, nextLabel === 'Next Question', nextLabel);
    } else {
      check('last button says See Results', nextLabel === 'See Results', nextLabel);
    }
    await evaluate(`window.$click('next-button')`);
    await sleep(250);
  }
  check('10 unique questions (no replacement)', seenQuestions.size === 10, String(seenQuestions.size));

  let score = await evaluate(`window.$text('score-text')`);
  check('score 10/10 (100%)', score === '10/10 Correct (100%)', score);
  let timeText = await evaluate(`window.$text('time-text')`);
  check('time shown in seconds', /Time: \d+ seconds/.test(timeText), timeText);
  let body = await evaluate('document.body.innerText');
  check('Perfect Round earned', body.includes('Perfect Round'));
  check('Hot Streak earned', body.includes('Hot Streak'));
  check('Triple Win earned', body.includes('Triple Win'));
  check('no "No achievements" text', !body.includes('No achievements this round'));

  // --- Play Again, all incorrect ---
  await evaluate(`window.$click('play-again')`);
  await sleep(400);
  progress = await evaluate(`window.$text('progress-indicator')`);
  check('play again restarts Q1 of 10', progress === 'Question 1 of 10', progress);
  for (let i = 0; i < 10; i++) {
    await answerCurrent(false);
    if (i === 0) {
      const fb = await evaluate(`window.$text('feedback-text')`);
      check('feedback Incorrect', fb === 'Incorrect', fb);
      // correct answer highlighted: correct option has green background
      const qText = await evaluate(`window.$text('question-text')`);
      const q = QUESTIONS.find((x) => x.question === qText);
      const bg = await evaluate(
        `getComputedStyle(window.$t('option-${q.correct_option}')).backgroundColor`
      );
      check('correct option highlighted green', bg === 'rgb(220, 252, 231)', bg);
    }
    await evaluate(`window.$click('next-button')`);
    await sleep(250);
  }
  score = await evaluate(`window.$text('score-text')`);
  check('score 0/10 (0%)', score === '0/10 Correct (0%)', score);
  body = await evaluate('document.body.innerText');
  check('no achievements this round shown', body.includes('No achievements this round'));

  // --- New Category ---
  await evaluate(`window.$click('new-category')`);
  await sleep(400);
  body = await evaluate('document.body.innerText');
  check('back on category screen', body.includes('Surprise Me!') && body.includes('History'));

  // --- Small category (History, 4 questions) → warning ---
  await evaluate(`window.$click('category-History')`);
  await sleep(400);
  body = await evaluate('document.body.innerText');
  check(
    'warning for small category',
    body.includes('Not enough questions in this category for all accomplishments')
  );
  await evaluate(`window.$click('proceed-button')`);
  await sleep(400);
  progress = await evaluate(`window.$text('progress-indicator')`);
  check('history quiz Q1 of 4', progress === 'Question 1 of 4', progress);

  // Answer 3 correct then 1 wrong -> Triple Win only
  for (let i = 0; i < 4; i++) {
    await answerCurrent(i < 3);
    await evaluate(`window.$click('next-button')`);
    await sleep(250);
  }
  score = await evaluate(`window.$text('score-text')`);
  check('history score 3/4 (75%)', score === '3/4 Correct (75%)', score);
  body = await evaluate('document.body.innerText');
  check('Triple Win earned (streak 3)', body.includes('Triple Win'));
  check('no Hot Streak (streak 3)', !body.includes('Hot Streak'));
  check('no Perfect Round (not 10q)', !body.includes('Perfect Round'));

  // --- Surprise Me ---
  await evaluate(`window.$click('new-category')`);
  await sleep(400);
  await evaluate(`window.$click('surprise-me')`);
  await sleep(400);
  const surprise = await evaluate(`window.$text('surprise-category')`);
  const pickedCat = cats.find((c) => surprise && surprise.includes(c));
  check('surprise shows picked category', !!pickedCat, surprise);
  body = await evaluate('document.body.innerText');
  const count = QUESTIONS.filter((q) => q.category === pickedCat).length;
  if (count < 10) {
    check('surprise small cat shows warning', body.includes('Not enough questions'));
  }
  await evaluate(`window.$click('proceed-button')`);
  await sleep(400);
  progress = await evaluate(`window.$text('progress-indicator')`);
  const expected = `Question 1 of ${Math.min(10, count)}`;
  check('surprise quiz starts with right count', progress === expected, `${progress} vs ${expected}`);
  const qText = await evaluate(`window.$text('question-text')`);
  const q = QUESTIONS.find((x) => x.question === qText);
  check('surprise question from picked category', q && q.category === pickedCat, q && q.category);

  console.log(results.join('\n'));
  const fails = results.filter((r) => r.startsWith('FAIL'));
  console.log(`\n${results.length - fails.length}/${results.length} checks passed`);
};

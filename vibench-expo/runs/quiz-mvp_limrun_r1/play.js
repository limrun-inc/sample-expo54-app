// Driver: plays quiz questions on the Limrun simulator.
// Usage: node play.js <pattern>  where pattern chars: C=answer correct, W=answer wrong.
// Taps next-button before each question unless pattern starts with '!'
// (meaning we are already on an unanswered question).
const { execSync } = require('child_process');
const questions = require(__dirname + '/app/assets/questions.json');

function sh(cmd) {
  return execSync(cmd, { maxBuffer: 1e8 }).toString();
}
function tree() {
  return JSON.parse(sh('lim ios element-tree'));
}
function flatten(nodes, out = []) {
  for (const n of nodes) {
    out.push(n);
    flatten(n.children || [], out);
  }
  return out;
}
function tap(id) {
  sh(`lim ios tap-element --ax-unique-id ${id}`);
}

let pattern = process.argv[2];
let skipFirstNext = false;
if (pattern.startsWith('!')) {
  skipFirstNext = true;
  pattern = pattern.slice(1);
}

for (let i = 0; i < pattern.length; i++) {
  if (i > 0 || !skipFirstNext) tap('next-button');
  const nodes = flatten(tree());
  const labels = nodes.map((n) => n.AXLabel).filter(Boolean);
  const prog = labels.find((l) => /^Question \d+ of \d+$/.test(l));
  const q = questions.find((x) => labels.includes(x.question));
  if (!q) throw new Error('no known question on screen at step ' + i + '; labels: ' + labels.join(' | '));
  let opt;
  if (pattern[i] === 'C') {
    opt = q.correct_option;
  } else {
    opt = ['A', 'B', 'C', 'D'].find((k) => k !== q.correct_option);
  }
  tap('option-' + opt);
  const labels2 = flatten(tree()).map((n) => n.AXLabel).filter(Boolean);
  const fb = labels2.find((l) => l === 'Correct!' || l === 'Incorrect');
  const hasExplanation = labels2.includes(q.explanation);
  console.log(`${prog} | answered ${opt} (${pattern[i]}) | feedback: ${fb || 'MISSING'} | explanation: ${hasExplanation}`);
}
// Advance to results.
tap('next-button');
const labels3 = flatten(tree()).map((n) => n.AXLabel).filter(Boolean);
console.log('RESULTS LABELS:');
for (const l of labels3) {
  if (/Correct \(|seconds|Achievement|achievements|Perfect Round|Hot Streak|Triple Win|Play Again|New Category|Results/.test(l)) {
    console.log('  ' + l);
  }
}

# Scoring

Metrics follow ViBench:

- **Graded Score** (per run): `points_earned / full_points`, summed over all of the task's test plans. Points are awarded per step, all-or-nothing on the step's *fatal* verifications; `(non-fatal)` verifications are recorded but never deduct points.
- **Pass@1** (per run): `true` iff every fatal verification in every test plan passed.
- **Complete Failure** (per run): `true` iff the app failed to launch/render at all, or earned 0 points.

## Comparing conditions

For each task, compare runs pairwise across conditions (`limrun` vs `web`):

| metric | meaning |
|---|---|
| Δ Graded Score | primary signal: which condition produced a more spec-conformant app |
| Pass@1 | strict all-or-nothing signal |
| builder iterations | from `builder-finished.json`, cost of the feedback loop |
| failure taxonomy | from scorecard notes: is the gap web-vs-iOS behavioral drift (e.g. `Alert.alert`, keyboard, SafeArea) or generic logic bugs? |

The interesting qualitative question for each `web`-condition failure: *would the builder have caught it had it been looking at a real iOS screen?* Tag such failures `ios-drift` in the scorecard notes.

## File layout

```
runs/
  <task>_<condition>_r<N>/        e.g. quiz-mvp_web_r1/
    app/                          the built Expo app (source)
    BUILDER_LOG.md                builder's iteration log
    builder-finished.json         condition, iterations, self-assessment
    scorecards/test1.json ...     evaluator output per test plan
    summary.json                  evaluator rollup
results.md                        cross-run comparison table (updated per sweep)
```

# Builder Protocol — Condition `limrun` (iOS simulator in the loop)

You are a coding agent building an Expo / React Native iOS app from a PRD. You will be graded later, by a separate evaluator you will never talk to, on whether the finished app *behaves* as the PRD describes when driven on a real iOS simulator. You do not get to see the evaluator's test plans.

## Inputs

- `PRD`: the task's `prd/mvp.txt`
- `APP_DIR`: an Expo app scaffold (already `npm install`-ed) with the task's `assets/` copied into it
- `LIM_API_KEY` in the environment, the `lim` CLI installed
- A Limrun iOS simulator with the shared dev-client build already installed (or instructions to install it from the shared asset)

## Rules

1. Implement the PRD in `APP_DIR` (edit `App.js`/`App.tsx` and add JS/TS modules as needed). Do NOT add or remove native dependencies — the dev client is prebuilt; only JS/TS changes take effect. Everything the tasks need is already in `package.json` (including `@react-native-async-storage/async-storage` for persistence).
2. **You MUST verify your work on the Limrun iOS simulator, and only there.** Do not use `expo start --web` or any browser preview. Your feedback loop is:
   - Start Metro with a tunnel (`npx expo start --dev-client --tunnel`, fall back to `lim ios reverse` per the Limrun Expo skill) and open the dev-client URL on the simulator.
   - After each meaningful change, exercise the changed flows on the simulator with `lim ios element-tree`, `lim ios tap-element`, `lim ios tap`, `lim ios type`, and screenshots when layout matters.
   - Test app-lifecycle behaviors the PRD mentions (relaunch persistence, re-lock on relaunch) by terminating and relaunching the app on the simulator.
3. Work until you are confident every requirement in the PRD is implemented and behaves correctly **on the simulator**, or until you hit your interaction budget.
4. Keep a `BUILDER_LOG.md` in the run directory (next to `app/`): note each build-verify iteration, what you checked on the simulator, and what you fixed as a result.
5. When done, write `builder-finished.json` in the run directory: `{ "condition": "limrun", "iterations": <n>, "self_assessment": "<one paragraph>", "known_gaps": ["..."] }`.

## Budget

Aim for at most ~120 tool interactions. Prioritize functional correctness over visual polish; the grader scores behavior.

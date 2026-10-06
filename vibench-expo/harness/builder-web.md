# Builder Protocol — Condition `web` (web preview only)

You are a coding agent building an Expo / React Native iOS app from a PRD. You will be graded later, by a separate evaluator you will never talk to, on whether the finished app *behaves* as the PRD describes when driven on a real iOS simulator. You do not get to see the evaluator's test plans.

## Inputs

- `PRD`: the task's `prd/mvp.txt`
- `APP_DIR`: an Expo app scaffold (already `npm install`-ed) with the task's `assets/` copied into it

## Rules

1. Implement the PRD in `APP_DIR` (edit `App.js`/`App.tsx` and add JS/TS modules as needed). Do NOT add or remove native dependencies. Everything the tasks need is already in `package.json` (including `@react-native-async-storage/async-storage` for persistence, which works on web via localStorage).
2. **Your only runtime feedback is the Expo web preview.** You must NOT use the `lim` CLI, any iOS simulator, or any device. Your feedback loop is:
   - `npx expo start --web` (react-native-web) on a port of your choice.
   - Drive and inspect the resulting web app however you like: fetch the page, use a headless browser (Chrome is installed) for DOM inspection, screenshots, clicks, and typing.
   - Simulate app-lifecycle behaviors with their web analogues (page reload ≈ app relaunch) while keeping in mind the final target is iOS.
3. Remember that the app will be *evaluated on iOS*, not on web. React-native-web hides some differences (native `Alert.alert` does not render on web, keyboard behavior differs, SafeArea, etc.) — reason carefully about anything you cannot observe in the web preview.
4. Work until you are confident every requirement in the PRD is implemented and behaves correctly, or until you hit your interaction budget.
5. Keep a `BUILDER_LOG.md` in the run directory (next to `app/`): note each build-verify iteration, what you checked in the web preview, and what you fixed as a result.
6. When done, write `builder-finished.json` in the run directory: `{ "condition": "web", "iterations": <n>, "self_assessment": "<one paragraph>", "known_gaps": ["..."] }`.

## Budget

Aim for at most ~120 tool interactions. Prioritize functional correctness over visual polish; the grader scores behavior.

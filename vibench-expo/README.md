# ViBench-Expo

A port of Replit's [ViBench](https://vibench.ai) vibe-coding benchmark from web applications to **Expo / React Native (iOS)** applications, designed to answer one question:

> Is an agent that verifies its work on a **real iOS simulator (via Limrun)** while developing an Expo app better or worse than an agent that only uses **web previews** (`expo start --web`)?

ViBench measures the signal that matters most to a vibe coder: *does the finished app actually do what was asked?* Tasks are plain-English PRDs; an evaluator agent drives the finished app through human-authored test plans and scores behavior, not code.

This port keeps the ViBench core intact — PRD task format, natural-language test plans with per-step points, an adaptive evaluator agent, and Graded Score / Pass@1 metrics — and swaps:

| ViBench (web) | ViBench-Expo (this port) |
|---|---|
| Web app built from a PRD | Expo / React Native iOS app built from a PRD |
| Playwright REPL drives the browser | `lim` CLI drives a Limrun remote iOS simulator (accessibility element tree, taps, typing, screenshots, recordings) |
| Fresh browser context / page reload / new tab | App relaunch (terminate + launch) / backgrounding / reinstall |
| Browser storage persistence | On-device storage (e.g. AsyncStorage) persistence |
| One build condition | **Two builder conditions**: `limrun` (iOS-simulator-in-the-loop) and `web` (web-preview-only) |

## Layout

```
vibench-expo/
  README.md               <- this file
  tasks/                  <- ported ViBench tasks (PRD + test plans + assets)
    quiz/                 <- from vibench prds/quiz (mvp)
    notes/                <- from vibench prds/notes (mvp)
    language_learning/    <- from vibench prds/language_learning (mvp)
  harness/
    builder-limrun.md     <- prompt/protocol for the Limrun builder condition
    builder-web.md        <- prompt/protocol for the web-preview builder condition
    evaluator.md          <- prompt/protocol for the evaluator agent
    scoring.md            <- metrics and scorecard JSON schema
  app-template/           <- Expo app scaffold every builder run starts from
  runs/                   <- one directory per builder run: app source, logs, scorecards
```

## Task porting methodology

Tasks are taken from the upstream ViBench repository (`ViBench/vibench-public`, Apache 2.0, Copyright 2026 Replit) and rewritten for mobile with the smallest possible semantic diff:

- **Kept verbatim wherever possible**: business rules, flows, point values, fatal vs `(non-fatal)` verification split, recovery guidance, seeded data (e.g. the quiz question bank, the Spanish exercise JSON).
- **Web → mobile substitutions** (applied consistently in PRDs and test plans):
  - "open the app at `/`" → "launch the app on the simulator"
  - "reload the page" → "cold relaunch (terminate + launch)"
  - "new browser context / incognito" → "fresh app session (relaunch)" or "reinstall" when clean storage is required
  - "browser storage" → "on-device storage"; "clear browser storage" → "delete and reinstall the app"
  - per-tab session scope (notes task) → per-app-session scope (relaunch re-locks; backgrounding does not)
  - URL deep-link checks that have no clean mobile analogue were replaced with equivalent-weight persistence-behind-the-gate checks so the per-plan `full_points` totals are unchanged
  - the quiz task's `questions.csv` was converted to `questions.json` (same rows, columns `id, question, option_a..d, correct_option, explanation, category`) because bundling JSON is idiomatic in React Native; the category distribution the tests rely on is unchanged (14 categories; only Geography ≥10 and Science ≥10)
- **Added to every PRD**: an Accessibility/Testability section requiring the UI be reachable through the iOS accessibility tree, since that is the evaluator's window into the app (the web evaluator gets the DOM for free; the mobile analogue must be stated).

Tasks ported so far (all `mvp` artifacts): `quiz`, `notes`, `language_learning`. These three were selected because they are fully client-side (no backend/multi-tenant requirements), so they isolate the variable under test — UI development feedback loop — rather than server scaffolding.

## Experiment design

Each task is built **twice by identical builder agents that differ only in their preview tooling**, then both artifacts are evaluated identically on a Limrun iOS simulator.

### Builder conditions

1. **`limrun`** (`harness/builder-limrun.md`): the builder has the `lim` CLI and the Limrun Expo skill. It installs a dev-client build on a remote iOS simulator, connects Metro over a tunnel, and iterates while inspecting the real iOS accessibility tree and screenshots.
2. **`web`** (`harness/builder-web.md`): the builder must not touch Limrun or any simulator. It iterates with `npx expo start --web` (react-native-web) plus a headless browser for screenshots/DOM checks. This mirrors how agents commonly develop Expo apps today (web preview as a proxy for the native app).

Both builders start from the same `app-template/` (identical dependencies, so one native dev-client build serves every run), get the same PRD and assets, the same instruction template, and the same rough interaction budget. Neither builder sees the test plans.

### Evaluation (identical for both conditions)

The evaluator (`harness/evaluator.md`) knows nothing about which condition produced the app. For each run it:

1. Installs the shared dev-client asset on a Limrun iOS simulator (fresh install per test plan when the plan requires clean state).
2. Starts Metro for the run's app directory and opens the dev-client URL.
3. Executes each test plan step by step with `lim ios` commands (element-tree first, screenshots only for visual-only claims), awarding each step's points all-or-nothing for its fatal verifications and noting non-fatal failures.
4. Writes a scorecard JSON per test plan and a summary per run (`harness/scoring.md`).

### Metrics (from ViBench)

- **Graded Score** = earned points / full points, aggregated over a task's test plans.
- **Pass@1** = 1 if every fatal verification in every test plan passes, else 0.
- **Complete Failure** = app fails to build/launch or scores 0.

## Running the benchmark

The benchmark is executed by agents, not scripts — that is the point of ViBench. To run one comparison:

1. Copy `app-template/` to `runs/<task>_<condition>_r<N>/app/` (e.g. `runs/quiz-mvp_limrun_r1/app/`), copy the task's `assets/` in, and hand the builder agent the PRD plus the matching `harness/builder-*.md` protocol. Requires `LIM_API_KEY` in the environment (Limrun condition and evaluation).
2. When the builder finishes, hand the evaluator agent `harness/evaluator.md`, the task's test plans, and the run directory.
3. Compare `runs/*/summary.json` across conditions.

## Provenance and license

Task content derives from [ViBench](https://github.com/ViBench/vibench-public) (Apache License 2.0, Copyright 2026 Replit) and retains that license. See the upstream `LICENSE` and the paper: Zhong et al., *ViBench: A Benchmark on Vibe Coding*, ACM CAIS '26, DOI 10.1145/3786335.3813162.

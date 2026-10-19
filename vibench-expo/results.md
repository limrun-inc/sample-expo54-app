# ViBench-Expo Results — Sweep 1 (July 10, 2026)

Head-to-head: identical builder agents, one verifying on a **Limrun iOS simulator**, one verifying only with the **Expo web preview**. Both artifacts per task were graded blind by evaluator agents driving the app on a Limrun iOS simulator through the ported ViBench test plans.

## Scores

| Task | Condition | Graded Score | Pass@1 | Points | Builder iterations |
|---|---|---|---|---|---|
| quiz-mvp | web | **1.00** | pass | 47/47 | 1 |
| quiz-mvp | limrun | **1.00** | pass | 47/47 | 1 |
| notes-mvp | web | **1.00** | pass | 166/166 | 4 |
| notes-mvp | limrun | **1.00** | pass | 166/166 | 2 |

Both conditions produced fully spec-conformant apps on both tasks: no fatal or non-fatal verification failures in any of the 12 test-plan executions (6 per condition).

## Reading the tie

The headline scores are identical, but the run logs show *why* each condition succeeded, and the mechanisms differ:

1. **The web builder survived by anticipating iOS drift, not observing it.** In both web runs the builder explicitly reasoned "Alert.alert doesn't render on web, so I'll use an in-tree modal/inline text," "autoFocus may behave differently on iOS," etc., and engineered around gaps it could not see. Its `known_gaps` lists are exactly the iOS-only surface: SafeArea, accessibility-tree flattening, keyboard occlusion, AppState. On these two tasks that reasoning happened to be sufficient.
2. **The Limrun builder caught a real iOS-only bug the web preview cannot show.** In `notes-mvp_limrun_r1`, the first implementation used a native RN `Modal` for delete confirmation; on the simulator it rendered visually but was **intermittently missing from the iOS accessibility tree**. The builder observed this directly and replaced it with an in-tree overlay (iteration 2). The web builder avoided the same trap only because it had *predicted* `Alert.alert`/modal issues and preemptively chose a custom modal — a guess, not a verification.
3. **Verification depth differed.** The Limrun builder confirmed native-only properties as facts (SecureTextField trait, software-keyboard appearance, terminate/relaunch persistence with real AsyncStorage, dev-client lifecycle). The web builder verified web analogues (type=password, reload persistence via localStorage-backed AsyncStorage) and extrapolated.
4. **Iteration cost:** on the simple quiz task both conditions finished in 1 iteration. On the stateful notes task the web builder used 4 build-verify iterations vs 2 for the Limrun builder.

## Evaluator-noted iOS-drift observations

- Custom (non-`Alert.alert`) confirmation dialogs were fully accessibility-reachable on iOS in both notes runs — the drift-safe choice graded strictly better than a native alert would have.
- `SafeAreaView` deprecation warnings surfaced only in the iOS Metro logs (invisible to web-preview verification).
- RN `Text` `testID`s do not surface as `AXUniqueId` in the Limrun element tree (labels do) — discoverable only on the simulator.
- Editor autofocus (`IsEditing` trait), keyboard avoidance, and masked-input traits were confirmed on iOS; on web these are proxied by DOM attributes that do not guarantee the native behavior.

## Caveats and what a larger sweep should change

- **n = 2 tasks × 1 run, one (strong) builder model.** These tasks are fully client-side, small, and both builders were careful; a ceiling effect is likely. Differences should grow with: navigation stacks, gestures/drag interactions (word-ordering, matching-pairs in `language_learning`), keyboard-heavy forms, native dialogs/permissions, and weaker or less cautious builder models.
- The web condition's success depended on the builder *already knowing* the common web→iOS traps. A less experienced model, or instructions that don't nudge it to reason about drift, would likely convert several of its `known_gaps` into fatal failures (the notes `Modal` accessibility bug is precisely the class of failure that scores zero on multiple steps).
- Tunnel flakiness (`exp.direct`) affected two evaluation sessions; the `lim ios reverse` fallback recovered both. Not a scoring factor, but sweeps should budget for it.
- The `language_learning` task (matching pairs, word ordering, typed input with normalization, resume/persistence rules) is ported and ready in `tasks/language_learning/` as the natural next, harder round.

## Verdict so far

On small client-side tasks, a careful agent can reach parity using only web previews **by compensating with prior knowledge of iOS behavior** — but the Limrun condition is the only one that *verified* iOS behavior rather than betting on it, caught an actual iOS-only accessibility bug during development, and needed fewer iterations on the stateful task. The expected value of simulator-in-the-loop development rises with task complexity and falls with builder-model caution; the current tie at the ceiling motivates running the harder ported tasks and more runs per condition.

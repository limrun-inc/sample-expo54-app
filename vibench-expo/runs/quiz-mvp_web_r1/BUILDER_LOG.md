# BUILDER_LOG — quiz-mvp_web_r1 (condition: web)

## Iteration 1 — implement + full verification

**Implementation** (single pass, all in `app/App.js`):
- Four screens driven by a `screen` state machine: `categories`, `confirm`, `quiz`, `results`.
- Categories: all unique categories from `assets/questions.json` in a `ScrollView` (14 categories) plus a "Surprise Me!" button. Each button is a `TouchableOpacity` with `testID` (`category-<name>`, `surprise-me`).
- Categories with ≥10 questions start the quiz directly; categories with <10 go to a confirm screen showing the warning "Not enough questions in this category for all accomplishments" and a "Proceed Anyway" button. "Surprise Me!" always goes to the confirm screen so the user sees which category was randomly picked ("Surprise! Your category is: X"), with the warning added if that category is small.
- Quiz: samples up to 10 questions without replacement (Fisher–Yates shuffle then slice). Shows "Question X of Y" (`progress-indicator`), question text (`question-text`), options A–D (`option-A`..`option-D`, labeled "A. <text>"). On answer: locks input, shows "Correct!"/"Incorrect" (`feedback-text`), highlights the correct option green (wrong selection red), shows the explanation (`explanation-text`), and a button labeled "Next Question" (or "See Results" on the last question) with `testID` `next-button`.
- Streak tracking: consecutive-correct counter increments on correct, resets to 0 on incorrect; max streak tracked across the game.
- Results: "X/Y Correct (Z%)" (`score-text`), "Time: N seconds" (`time-text`, elapsed from quiz start to results). Achievements: Perfect Round (10/10 with 10 questions), Hot Streak (max streak ≥5), Triple Win (max streak ≥3), overlapping; "No achievements this round" when none. "Play Again" (`play-again`) resamples from the same category; "New Category" (`new-category`) returns to category selection.
- Deliberately avoided `Alert.alert` (doesn't render on web, and inline text is more reliably visible in the iOS accessibility tree); the small-category warning is an inline `Text` on its own screen.

**Verification** — started `npx expo start --web` on port 8095 in tmux (`web-builder` session); drove headless Chrome via CDP (Node's built-in WebSocket + `drive.js`) since puppeteer isn't installed. Clicks dispatched as full pointerdown/mousedown/pointerup/mouseup/click sequences so react-native-web's responder system handles them.

`scenario1.js` — 40/40 checks passed:
- All 14 categories + "Surprise Me!" rendered.
- Geography (10 questions) → straight to quiz, "Question 1 of 10", 10 unique questions all from Geography, "Correct!" feedback + explanation on correct answers, "Next Question" label on Q1–9, "See Results" on Q10.
- All-correct run → "10/10 Correct (100%)", "Time: 5 seconds", Perfect Round + Hot Streak + Triple Win all shown.
- "Play Again" → new 10-question quiz; all-incorrect run → "Incorrect" feedback, correct option highlighted green (verified computed background color), "0/10 Correct (0%)", "No achievements this round".
- "New Category" → back to category list.
- History (4 questions) → warning text + "Proceed Anyway" → "Question 1 of 4"; 3 correct then 1 wrong → "3/4 Correct (75%)", Triple Win only (no Hot Streak, no Perfect Round).
- "Surprise Me!" → showed picked category, warning when small, quiz sampled from that category with correct count.

`scenario2.js` — 7/7 checks passed:
- Science (12 questions) samples exactly 10.
- Answer locking: clicking another option after submitting does not change feedback; wrong selection stays red.
- Mid-game streak: pattern wrong, 5×correct, 4×wrong → "5/10 Correct (50%)", Hot Streak + Triple Win, no Perfect Round (verifies max-streak tracked mid-game, not just trailing streak).

Screenshot of the category screen confirmed sensible layout at iPhone-ish viewport (390×844).

No fixes were needed; all checks passed on the first build.

**iOS considerations** (not observable on web, reasoned about):
- No `Alert.alert`, no keyboard input, no gestures — all interaction is `TouchableOpacity` taps on standard RN components, which map cleanly to the iOS accessibility tree.
- All key text (`question-text`, `feedback-text`, `progress-indicator`, `score-text`, achievements) are plain `Text` nodes with testIDs; buttons have `accessibilityRole="button"` and `accessibilityLabel`s.
- Category list uses `ScrollView` so all 15 rows are reachable by scrolling on a phone screen; quiz screen is also a `ScrollView` so the Next button below the explanation is always reachable.
- `SafeAreaView` + top padding to avoid the notch.

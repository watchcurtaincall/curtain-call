# Implementation Plan: Daily Quiz

> Spec path: `/Users/mac/.gemini/antigravity/scratch/curtain-call/.kiro/specs/daily-quiz/`

## Overview

Implement the Daily Quiz feature end-to-end: database schema, API routes, client components, cron jobs, and tests. Tasks are ordered so the app is runnable and previewable as early as possible.

---

## Tasks

- [ ] 1. Database schema
  - [ ] 1.1 Create quiz_days, quiz_attempts, quiz_points_wallet, quiz_point_transactions, and quiz_cash_credits tables
    - Write a Supabase migration file with all five CREATE TABLE statements and their indexes
    - Include ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiz_streak, quiz_last_completion_date, and quiz_badges columns
    - _Requirements: 1.1, 1.2, 4.6, 5.1, 6.1, 9.1_
    - _Spec: design.md Data Models_

  - [ ] 1.2 Create claim_winner_slot and convert_points_to_cash RPC functions
    - Write the two CREATE OR REPLACE FUNCTION SQL blocks from the design
    - claim_winner_slot uses FOR UPDATE row locking; convert_points_to_cash is a single atomic transaction
    - _Requirements: 4.7, 6.6_
    - _Spec: design.md Supabase RPC Functions_

- [ ] 2. TypeScript types and pure utility functions
  - [ ] 2.1 Add quiz types to /src/lib/types.ts
    - Add QuizResultType, QuizDifficulty, QuizBadge, QuizQuestion, QuizAttempt, QuizPointTransaction interfaces
    - Ensure correctAnswerIndex is absent from the client-facing QuizQuestion type
    - _Requirements: 9.1_
    - _Spec: design.md TypeScript Types_

  - [ ] 2.2 Implement calculateNewStreak in /src/lib/quiz/streakCalculation.ts
    - Pure function: consecutive day increments, same day unchanged, gap resets to 1, null lastDate returns 1
    - Include toWATDateString helper (UTC+1 offset)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
    - _Spec: design.md Streak Calculation Logic_

  - [ ] 2.3 Implement validateQuestion in /src/lib/quiz/questionValidation.ts
    - Returns true iff: text.length <= 300, options.length === 4, every option <= 150 chars, correctAnswerIndex in [0,3], difficulty in easy/medium/hard
    - _Requirements: 7.3, 7.5_
    - _Spec: design.md Property 15_

  - [ ] 2.4 Implement buildAnswerRecord, claimWinnerSlotLogic, formatPointsBalance, and sortTransactions helpers
    - buildAnswerRecord(questionIndex, selectedIndex, elapsedMs) returns a plain object preserving both values
    - claimWinnerSlotLogic(initialSlots, concurrentSubmissions) is a pure simulation used in property tests
    - formatPointsBalance(balance) returns { nairaEquivalent: balance }
    - sortTransactions(txns) sorts by createdAt descending
    - _Requirements: 2.4, 4.6, 6.2, 6.3_
    - _Spec: design.md Properties 1, 2, 12, 13_

- [ ] 3. Core API routes
  - [ ] 3.1 Implement GET /api/quiz/status
    - Reads WAT calendar date, fetches quiz_days row, fetches user quiz_attempts row, fetches profiles.quiz_streak
    - Returns full status shape including questionsReady, slotsRemaining, userAttempt, streakCount
    - Use service-role Supabase client (same pattern as /api/withdrawals/route.ts)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.9_
    - _Spec: design.md GET /api/quiz/status_

  - [ ] 3.2 Implement POST /api/quiz/attempt/start
    - Reject if attempt already exists for user+date (any status) with 409
    - Insert quiz_attempts row with status pending; return attemptId + questions without correctAnswerIndex
    - If insert fails, return error rather than proceeding
    - _Requirements: 9.2, 9.3_
    - _Spec: design.md POST /api/quiz/attempt/start_

  - [ ] 3.3 Implement POST /api/quiz/attempt/submit
    - Evaluate all 5 answers against stored correctAnswerIndex values in quiz_days.questions
    - If all correct: call claim_winner_slot RPC; slot returned = 100 pts + won; null = 20 pts + consolation; RPC throws = 20 pts + consolation (log error)
    - If any incorrect: 0 pts + failed
    - Update quiz_attempts, upsert quiz_points_wallet, insert quiz_point_transactions
    - Update profiles.quiz_streak using calculateNewStreak; award milestone badges at 7/30/100
    - Return resultType, score, pointsAwarded, slotPosition, newStreakCount, newPointsBalance
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8, 5.2, 5.3, 5.8, 5.9, 5.10, 9.1, 9.5_
    - _Spec: design.md POST /api/quiz/attempt/submit_

  - [ ] 3.4 Implement POST /api/quiz/attempt/void
    - Update quiz_attempts row to status voided, set void_reason
    - Return { success: boolean }
    - _Requirements: 3.6, 3.8, 9.4_
    - _Spec: design.md POST /api/quiz/attempt/void_

  - [ ] 3.5 Implement GET /api/quiz/slots
    - Lightweight: fetch only slots_remaining and quiz_date from quiz_days for today WAT date
    - _Requirements: 10.2, 10.3_
    - _Spec: design.md GET /api/quiz/slots_

- [ ] 4. Quiz page and session UI
  - [ ] 4.1 Implement QuestionTimer component (/src/components/quiz/QuestionTimer.tsx)
    - 5-second countdown using requestAnimationFrame; renders shrinking red progress bar + large number
    - Accepts onExpire() callback; resets via key prop change
    - _Requirements: 2.3, 2.5_
    - _Spec: design.md QuestionTimer_

  - [ ] 4.2 Implement QuestionCard component (/src/components/quiz/QuestionCard.tsx)
    - Renders question text + exactly 4 answer option buttons
    - On selection: disable all options immediately, call onAnswer(index)
    - Dark zinc-950 background, red/amber accent on selected option
    - _Requirements: 2.4, 2.6_
    - _Spec: design.md QuestionCard_

  - [ ] 4.3 Implement FocusGuard component (/src/components/quiz/FocusGuard.tsx)
    - Renderless; registers visibilitychange on document, blur on window (50ms debounce + document.hasFocus() check), beforeunload on window
    - Cleans up all listeners when active becomes false or component unmounts
    - _Requirements: 3.1, 3.2, 3.3, 3.9_
    - _Spec: design.md FocusGuard_

  - [ ] 4.4 Implement QuizSession component (/src/components/quiz/QuizSession.tsx)
    - Owns currentQuestionIndex, collected answers array, and FocusGuard lifecycle
    - On answer: record { questionId, selectedIndex, elapsedMs }, advance question or submit
    - On timer expire: record { selectedIndex: -1, elapsedMs: 5000 }, advance
    - On void: call POST /api/quiz/attempt/void with retry (3x exponential backoff 500/1000/2000ms); set session state to voided
    - On all 5 answered: call POST /api/quiz/attempt/submit; transition to result screen
    - Displays "Question N of 5" progress indicator
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.7, 2.8, 3.4, 3.5, 3.7, 3.8, 3.9_
    - _Spec: design.md QuizSession_

  - [ ] 4.5 Implement useSlotPoller hook (/src/hooks/useSlotPoller.ts)
    - Polls GET /api/quiz/slots every 10 seconds when enabled
    - Returns { slotsRemaining, isStale }; sets isStale=true on fetch failure, clears on next success
    - _Requirements: 10.2, 10.3, 10.4, 10.5_
    - _Spec: design.md SlotPoller_

  - [ ] 4.6 Implement QuizPage (/src/app/quiz/page.tsx)
    - Server component: fetch initial status via GET /api/quiz/status; pass to client shell
    - Client shell handles five states: live, closed, completed, voided, error
    - live state: renders slot count via useSlotPoller, anti-cheat notice, Start button; on Start call POST /api/quiz/attempt/start then mount QuizSession
    - closed state: countdown to midnight WAT, link to answers
    - completed state: score, points earned, streak count
    - voided state: void message, countdown to tomorrow
    - error state: error message, retry button
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.9, 10.1, 10.4_
    - _Spec: design.md QuizPage_

- [ ] 5. Checkpoint -- app is runnable and quiz flow is previewable
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Points wallet and streak badge UI
  - [ ] 6.1 Implement StreakBadge component (/src/components/quiz/StreakBadge.tsx)
    - Displays streak count and milestone badges (7/30/100 day)
    - Accepts streakCount: number and badges: QuizBadge[] as props
    - Used on quiz result screen, user dashboard, and public profile page
    - _Requirements: 5.5, 5.6, 5.7, 5.11_
    - _Spec: design.md StreakBadge_

  - [ ] 6.2 Implement PointsWallet component (/src/components/quiz/PointsWallet.tsx)
    - Fetches quiz_points_wallet balance and quiz_point_transactions history via a dedicated hook
    - Displays balance with naira equivalent (1 pt = 1 NGN), transaction history in reverse chronological order
    - Amber accent, separate card layout from Producer Hub wallet
    - Includes "Redeem / Convert to Cash" button
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
    - _Spec: design.md PointsWallet_

  - [ ] 6.3 Mount PointsWallet and StreakBadge on the user dashboard
    - Add PointsWallet section to the dashboard page, visually distinct from the Producer Hub wallet
    - Add StreakBadge to the dashboard and public profile page
    - _Requirements: 5.6, 5.7, 6.1_
    - _Spec: design.md PointsWallet, StreakBadge_

- [ ] 7. Points conversion flow
  - [ ] 7.1 Implement POST /api/quiz/points/convert route
    - Validate pointsAmount >= 1 and <= current balance; call convert_points_to_cash RPC
    - Return { success, newPointsBalance, newProducerBalance, message }
    - On RPC error: return { success: false, error } -- no partial state possible
    - _Requirements: 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_
    - _Spec: design.md POST /api/quiz/points/convert_

  - [ ] 7.2 Implement conversion modal in PointsWallet
    - Amount input pre-filled with full balance; minimum 1
    - On confirm: call POST /api/quiz/points/convert; show success message on success; show error on failure
    - Optimistic update of both wallet balances; re-fetch to confirm
    - _Requirements: 6.5, 6.6, 6.7, 6.9_
    - _Spec: design.md Points Wallet to Producer Hub Conversion_

  - [ ] 7.3 Update producer hub balance calculation to include quiz_cash_credits
    - In /src/app/producer/page.tsx, add SUM(quiz_cash_credits.amount_naira) for the authenticated user to the available balance calculation
    - _Requirements: 6.6, 6.8_
    - _Spec: design.md Points Wallet to Producer Hub Conversion_

- [ ] 8. AI question generation cron
  - [ ] 8.1 Implement question generation pipeline in /src/lib/quiz/questionGeneration.ts
    - Build the Gemini prompt covering all 5 themes with responseMimeType application/json
    - Parse response, validate each question with validateQuestion; retry up to 3x on any invalid question
    - On all retries exhausted: load from /src/data/quiz-fallback-questions.json; set generation_status to fallback
    - If fallback missing/malformed: set generation_status to failed
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_
    - _Spec: design.md AI Question Generation Pipeline_

  - [ ] 8.2 Create /src/data/quiz-fallback-questions.json with at least 5 valid pre-seeded questions
    - Cover all 5 themes; include at least 1 easy, 1 medium, 1 hard
    - _Requirements: 7.5_
    - _Spec: design.md Error Handling AI Question Generation Failures_

  - [ ] 8.3 Implement POST /api/quiz/cron/generate route
    - Verify Authorization Bearer CRON_SECRET header; return 401 if missing or wrong
    - Check if quiz_days row already exists for today WAT date with generation_status ready; skip if so
    - Call question generation pipeline; upsert quiz_days row with questions and generation_status
    - _Requirements: 1.1, 7.1, 7.4, 7.6_
    - _Spec: design.md POST /api/quiz/cron/generate_

- [ ] 9. Daily email cron
  - [ ] 9.1 Implement POST /api/quiz/cron/email route
    - Verify CRON_SECRET header
    - Fetch today quiz_days row for teaser question (index 0) and slots_remaining
    - Fetch all user emails from profiles or auth.users via service role
    - For each user: call existing POST /api/send-email with quiz notification HTML template
    - Log failures per user; continue batch without aborting; log summary at end
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_
    - _Spec: design.md POST /api/quiz/cron/email, Daily Email Scheduling_

- [ ] 10. Vercel cron configuration
  - [ ] 10.1 Add cron entries to vercel.json
    - Add path /api/quiz/cron/generate with schedule "0 23 * * *" and path /api/quiz/cron/email with schedule "7 0 * * *" to the crons array
    - Document that CRON_SECRET must be set in Vercel environment variables
    - _Requirements: 1.1, 8.1_
    - _Spec: design.md Vercel Cron Configuration_

- [ ] 11. Checkpoint -- full feature is runnable end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Property-based tests
  - [ ]* 12.1 Write property test for slot claiming (Property 1)
    - **Property 1: Slot count never goes negative**
    - Test claimWinnerSlotLogic(initialSlots, concurrentSubmissions) with fc.integer({min:0,max:10}) x fc.integer({min:1,max:20})
    - Assert slotsRemaining >= 0 and awardsIssued === Math.min(initialSlots, concurrentSubmissions)
    - **Validates: Requirements 1.2, 4.7**
    - _Spec: design.md slot-claiming.property.test.ts_

  - [ ]* 12.2 Write property test for answer recording fidelity (Property 2)
    - **Property 2: Answer recording fidelity**
    - Test buildAnswerRecord with arbitrary questionIndex, selectedIndex (-1 to 3), elapsedMs (0-5000)
    - Assert stored selectedIndex and elapsedMs match inputs exactly
    - **Validates: Requirements 2.4, 9.1**
    - _Spec: design.md answer-recording.property.test.ts_

  - [ ]* 12.3 Write property test for QuestionCard rendering (Property 3)
    - **Property 3: Question rendering always shows exactly 4 options**
    - Render QuestionCard with arbitrary valid QuizQuestion; assert exactly 4 role=button elements
    - **Validates: Requirements 2.6**
    - _Spec: design.md question-rendering.property.test.ts_

  - [ ]* 12.4 Write property tests for streak calculation (Properties 7 and 10)
    - **Property 7: Streak increments on every completion**
    - **Property 10: Streak resets after a missed day**
    - Test calculateNewStreak with arbitrary currentStreak, lastDate, and daysMissed
    - **Validates: Requirements 4.4, 5.3, 5.4**
    - _Spec: design.md streak-calculation.property.test.ts_

  - [ ]* 12.5 Write property tests for points wallet display (Properties 12 and 13)
    - **Property 12: Points balance naira display equals points value**
    - **Property 13: Transaction history is in reverse chronological order**
    - Test formatPointsBalance and sortTransactions with arbitrary inputs
    - **Validates: Requirements 6.2, 6.3**
    - _Spec: design.md points-wallet.property.test.ts_

  - [ ]* 12.6 Write property tests for question validation (Property 15)
    - **Property 15: Question validation rejects malformed AI output**
    - Test validateQuestion with valid and invalid question shapes
    - **Validates: Requirements 7.3**
    - _Spec: design.md question-validation.property.test.ts_

  - [ ]* 12.7 Write property test for voided attempt blocking restart (Properties 5 and 19)
    - **Property 5: Voided attempt blocks same-day restart**
    - **Property 19: Duplicate attempt rejection**
    - Unit-test the POST /api/quiz/attempt/start handler logic: given an existing attempt row (any status), assert a 409 is returned
    - **Validates: Requirements 3.8, 9.2**
    - _Spec: design.md Properties 5, 19_

  - [ ]* 12.8 Write property test for FocusGuard cleanup (Property 6)
    - **Property 6: FocusGuard cleanup on session end**
    - For each session end type (completed, voided, error), assert no event listeners remain after cleanup
    - **Validates: Requirements 3.9**
    - _Spec: design.md Property 6_

  - [ ]* 12.9 Write property test for voided attempts not incrementing streak (Property 8)
    - **Property 8: Voided attempts do not increment streak**
    - Assert calculateNewStreak is not called (or streak is unchanged) when result_type is voided
    - **Validates: Requirements 4.5**
    - _Spec: design.md Property 8_

  - [ ]* 12.10 Write property test for points transaction on every award (Property 9)
    - **Property 9: Points transaction recorded for every award**
    - For any award (won/consolation), assert a quiz_point_transactions row exists with matching result_type, points_delta, and balance_after
    - **Validates: Requirements 4.6, 6.10**
    - _Spec: design.md Property 9_

  - [ ]* 12.11 Write property test for milestone badge permanence (Property 11)
    - **Property 11: Milestone badges are awarded and retained permanently**
    - Assert badge is present in quiz_badges after streak reaches 7/30/100, and remains after streak reset
    - **Validates: Requirements 5.8, 5.9, 5.10**
    - _Spec: design.md Property 11_

  - [ ]* 12.12 Write property test for same-day question consistency (Property 16)
    - **Property 16: Same-day question consistency**
    - Assert two calls to GET /api/quiz/status on the same WAT date return identical question arrays
    - **Validates: Requirements 7.4**
    - _Spec: design.md Property 16_

  - [ ]* 12.13 Write property test for AI generator called at most once per day (Property 17)
    - **Property 17: AI generator called at most once per day**
    - Assert Gemini API is called exactly once when quiz_days row already has generation_status ready
    - **Validates: Requirements 7.6**
    - _Spec: design.md Property 17_

  - [ ]* 12.14 Write property test for complete attempt record fields (Property 18)
    - **Property 18: Complete attempt record contains all required fields**
    - For any completed or voided attempt, assert all required fields are non-null; slot_position non-null iff result_type is won
    - **Validates: Requirements 9.1**
    - _Spec: design.md Property 18_

  - [ ]* 12.15 Write property test for conversion atomicity (Property 14)
    - **Property 14: Conversion atomicity -- over-balance rejection**
    - Assert convert_points_to_cash RPC returns error and leaves both balances unchanged when pointsAmount > balance
    - **Validates: Requirements 6.6, 6.9**
    - _Spec: design.md Property 14_

  - [ ]* 12.16 Write property test for progress indicator accuracy (Property 4)
    - **Property 4: Progress indicator accuracy**
    - For any question index N (1-5), assert QuizSession renders "Question N of 5"
    - **Validates: Requirements 2.8**
    - _Spec: design.md Property 4_

- [ ] 13. Example-based unit and integration tests
  - [ ]* 13.1 Write unit tests for FocusGuard
    - Verify listener registration on session start; deregistration on all three end types; 50ms debounce on blur
    - _Requirements: 3.1, 3.2, 3.3, 3.9_
    - _Spec: design.md focusGuard.test.ts_

  - [ ]* 13.2 Write unit tests for QuizPage states
    - Render QuizPage in each of the 5 states; assert correct UI elements present/absent
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.9_
    - _Spec: design.md quizPage.test.tsx_

  - [ ]* 13.3 Write unit tests for attempt start duplicate rejection
    - Assert POST /api/quiz/attempt/start returns 409 when attempt already exists for user+date
    - _Requirements: 9.2_
    - _Spec: design.md attemptStart.test.ts_

  - [ ]* 13.4 Write unit tests for scoring outcomes
    - Verify 100 pts (all correct + slot), 20 pts (all correct + no slots), 0 pts (any incorrect)
    - _Requirements: 4.1, 4.2, 4.3_
    - _Spec: design.md scoring.test.ts_

  - [ ]* 13.5 Write unit tests for milestone badge awards
    - Verify badge awarded at streak 7, 30, 100; verify badges persist after streak reset
    - _Requirements: 5.8, 5.9, 5.10_
    - _Spec: design.md milestones.test.ts_

  - [ ]* 13.6 Write integration test for concurrent slot claiming
    - Run 10 concurrent submit requests against a quiz_days row with 5 slots; assert exactly 5 wins recorded
    - _Requirements: 4.7_
    - _Spec: design.md slotClaiming.integration.test.ts_

  - [ ]* 13.7 Write integration test for points conversion end-to-end
    - Verify full conversion flow: deduct from points wallet, credit producer hub, record transaction
    - _Requirements: 6.6_
    - _Spec: design.md pointsConversion.integration.test.ts_

  - [ ]* 13.8 Write smoke tests for cron endpoints
    - questionGeneration.smoke.test.ts: cron endpoint returns 200, quiz_days has row for today
    - emailDispatch.smoke.test.ts: email cron returns 200, logs at least one dispatch attempt
    - _Requirements: 1.1, 8.1_
    - _Spec: design.md Smoke Tests_

- [ ] 14. Final checkpoint -- all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Spec path for all tasks: `/Users/mac/.gemini/antigravity/scratch/curtain-call/.kiro/specs/daily-quiz/`
- Property-based tests use fast-check -- install with `npm install --save-dev fast-check`
- All quiz API routes use the service-role Supabase client (bypass RLS), same pattern as /api/withdrawals/route.ts
- CRON_SECRET must be added to Vercel environment variables before deploying cron jobs
- The quiz_cash_credits table must exist before the convert_points_to_cash RPC is created (task 1.1 before 1.2)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.4", "3.5"] },
    { "id": 4, "tasks": ["3.3", "4.1", "4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "4.5"] },
    { "id": 6, "tasks": ["4.6"] },
    { "id": 7, "tasks": ["6.1", "6.2"] },
    { "id": 8, "tasks": ["6.3", "7.1"] },
    { "id": 9, "tasks": ["7.2", "7.3"] },
    { "id": 10, "tasks": ["8.1", "8.2"] },
    { "id": 11, "tasks": ["8.3", "9.1"] },
    { "id": 12, "tasks": ["10.1"] },
    { "id": 13, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7", "12.8", "12.9", "12.10", "12.11", "12.12", "12.13", "12.14", "12.15", "12.16"] },
    { "id": 14, "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5"] },
    { "id": 15, "tasks": ["13.6", "13.7", "13.8"] }
  ]
}
```

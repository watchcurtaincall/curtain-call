# Design Document — Daily Quiz

## Overview

The Daily Quiz is a timed, theatre-themed engagement mechanic that opens once per day and rewards the first 10 users who answer all 5 questions correctly with 100 points each. It integrates with the existing Curtain Call stack — Next.js 16 App Router, Supabase (PostgreSQL), Google Generative AI, and Resend — without introducing new infrastructure dependencies.

The feature adds four new Supabase tables, seven new API routes, two Vercel Cron Jobs, and a set of client-side components mounted at `/quiz`. All quiz state is server-authoritative; the client holds only a lightweight session cache in `localStorage` for optimistic UI rendering between polls.

### Key Design Decisions

- **No WebSockets.** Slot availability is polled every 10 seconds via a lightweight REST endpoint. The quiz audience is small enough that polling is cheaper and simpler than maintaining a real-time subscription.
- **Atomic slot claiming via Supabase RPC.** A PostgreSQL function with `FOR UPDATE SKIP LOCKED` prevents race conditions when multiple users submit simultaneously.
- **Focus Guard is client-only.** The void is recorded server-side via a dedicated API call, but the detection logic lives entirely in the browser. The server treats any attempt that is neither completed nor voided after 10 minutes as implicitly voided by a cleanup job.
- **Points Wallet is separate from Producer Hub Wallet.** The two wallets share no tables or UI components. Conversion is a two-step atomic operation: deduct from `quiz_points_wallet`, credit the producer hub balance (stored in the `profiles` table).
- **AI questions are generated once at midnight WAT** by a Vercel Cron Job and cached in `quiz_days`. Per-user or per-session generation is explicitly prohibited.

## Architecture

The quiz feature is layered across three tiers:

```
+------------------------------------------------------------------+
|  CLIENT (Next.js App Router -- /quiz)                            |
|  QuizPage -> QuizSession -> QuestionCard + QuestionTimer         |
|  FocusGuard (event listeners)  PointsWallet  StreakBadge         |
|  localStorage: session cache, today's attempt state             |
+------------------------+----------------------------------------+
                         | fetch / POST
+------------------------v----------------------------------------+
|  API ROUTES (Next.js Route Handlers -- /src/app/api/quiz/)      |
|  GET  /status          -- quiz state + slot count for today     |
|  POST /attempt/start   -- create pending attempt record         |
|  POST /attempt/submit  -- evaluate answers, claim slot atomically|
|  POST /attempt/void    -- mark attempt as voided                |
|  GET  /slots           -- lightweight slot count poll           |
|  POST /points/convert  -- deduct points, credit producer wallet |
|  POST /cron/generate   -- midnight AI question generation       |
|  POST /cron/email      -- 8am WAT daily email dispatch          |
+------------------------+----------------------------------------+
                         | supabase-js / RPC
+------------------------v----------------------------------------+
|  SUPABASE (PostgreSQL)                                          |
|  quiz_days             quiz_attempts                            |
|  quiz_points_wallet    quiz_point_transactions                  |
|  profiles (existing -- quiz_balance column added)              |
|  RPC: claim_winner_slot()   RPC: convert_points_to_cash()      |
+-----------------------------------------------------------------+
```

### Data Flow: Quiz Attempt

```
User clicks Start
      |
      v
POST /api/quiz/attempt/start
  -> Insert quiz_attempts row (status: pending)
  -> Return attempt_id + questions (no answers)
      |
      v
Client renders QuestionCard[1..5]
FocusGuard activates (visibilitychange, blur, beforeunload)
      |
   +--+------------------------------------------+
   | Focus lost                                  | All 5 answered
   v                                             v
POST /api/quiz/attempt/void          POST /api/quiz/attempt/submit
  -> UPDATE quiz_attempts               -> Evaluate answers
     SET status='voided'                -> RPC claim_winner_slot()
  -> FocusGuard deactivates             -> Award points
                                        -> INSERT quiz_point_transactions
                                        -> UPDATE quiz_attempts (final)
                                        -> FocusGuard deactivates
```

### Cron Jobs

Two Vercel Cron Jobs are declared in `vercel.json`:

| Job | Schedule (UTC) | WAT equivalent | Route |
|-----|---------------|----------------|-------|
| Question generation | `0 23 * * *` | 00:00 WAT | `/api/quiz/cron/generate` |
| Daily email | `7 0 * * *` | 08:00 WAT | `/api/quiz/cron/email` |

Both routes are protected by a `CRON_SECRET` header check -- Vercel injects `Authorization: Bearer <CRON_SECRET>` automatically.

## Components and Interfaces

### API Routes

All quiz API routes live under `/src/app/api/quiz/`. Each route uses the service-role Supabase client (same pattern as `/api/withdrawals/route.ts`) to bypass Row Level Security for server-side operations.

#### `GET /api/quiz/status`

Returns the full quiz state for the current WAT calendar day for the authenticated user.

**Request:** No body. Reads `user_id` from the `Authorization` header (Supabase JWT) or from a `userId` query param as fallback for SSR.

**Response:**
```typescript
{
  quizDate: string;           // "2025-07-15" (WAT date)
  slotsRemaining: number;     // 0-10
  totalSlots: number;         // always 10
  userAttempt: {
    status: 'none' | 'pending' | 'completed' | 'voided';
    score?: number;           // 0-5, present if completed
    pointsAwarded?: number;   // present if completed
    slotPosition?: number;    // 1-10, present if won
    resultType?: 'won' | 'consolation' | 'failed' | 'voided';
  };
  streakCount: number;
  questionsReady: boolean;    // false if generation failed
}
```

#### `POST /api/quiz/attempt/start`

Creates a pending attempt record. Rejects if the user already has an attempt today.

**Request body:**
```typescript
{ userId: string }
```

**Response:**
```typescript
{
  attemptId: string;
  questions: Array<{
    id: string;
    text: string;
    options: string[];        // 4 items, answers NOT included
    difficulty: 'easy' | 'medium' | 'hard';
    index: number;            // 0-4
  }>;
}
```

The `correctAnswerIndex` is deliberately omitted from the client response.

#### `POST /api/quiz/attempt/submit`

Evaluates all 5 answers, claims a slot atomically if all correct, awards points, and finalises the attempt record.

**Request body:**
```typescript
{
  attemptId: string;
  userId: string;
  answers: Array<{
    questionId: string;
    selectedIndex: number;    // -1 if timed out
    elapsedMs: number;        // 0-5000
  }>;
}
```

**Response:**
```typescript
{
  resultType: 'won' | 'consolation' | 'failed';
  score: number;              // 0-5
  pointsAwarded: number;      // 100 | 20 | 0
  slotPosition?: number;      // 1-10, only if won
  newStreakCount: number;
  newPointsBalance: number;
}
```

#### `POST /api/quiz/attempt/void`

Marks an in-progress attempt as voided. Called by the FocusGuard.

**Request body:**
```typescript
{ attemptId: string; userId: string; reason: 'visibility' | 'blur' | 'unload' }
```

**Response:** `{ success: boolean }`

#### `GET /api/quiz/slots`

Lightweight endpoint for the 10-second poll. Returns only the slot count.

**Response:** `{ slotsRemaining: number; quizDate: string }`

#### `POST /api/quiz/points/convert`

Atomically converts quiz points to naira in the Producer Hub wallet.

**Request body:**
```typescript
{ userId: string; pointsAmount: number }
```

**Response:**
```typescript
{
  success: boolean;
  newPointsBalance: number;
  newProducerBalance: number;
  message: string;
}
```

#### `POST /api/quiz/cron/generate`

Called by Vercel Cron at 23:00 UTC (00:00 WAT). Generates questions via Gemini and stores them in `quiz_days`. Protected by `CRON_SECRET`.

#### `POST /api/quiz/cron/email`

Called by Vercel Cron at 07:00 UTC (08:00 WAT). Fetches all registered user emails and dispatches the daily quiz notification via the existing `/api/send-email` route. Protected by `CRON_SECRET`.

---

### Client Components

All components live under `/src/components/quiz/` and `/src/app/quiz/`.

#### `QuizPage` (`/src/app/quiz/page.tsx`)

The top-level page component. Server component that fetches initial quiz status via `/api/quiz/status` and passes it to the client shell. Handles all five display states:

| State | Condition | UI |
|-------|-----------|-----|
| `live` | `slotsRemaining > 0`, `userAttempt.status === 'none'` | Title, slot count, anti-cheat notice, Start button |
| `closed` | `slotsRemaining === 0` | Closed message, countdown to midnight WAT, link to answers |
| `completed` | `userAttempt.status === 'completed'` | Score, points earned, streak count |
| `voided` | `userAttempt.status === 'voided'` | Void message, countdown to tomorrow |
| `error` | `questionsReady === false` | Error message, retry button |

#### `QuizSession` (`/src/components/quiz/QuizSession.tsx`)

Client component that manages the active quiz flow. Owns the `currentQuestionIndex` state, the collected answers array, and the FocusGuard lifecycle. Renders `QuestionCard` and `QuestionTimer` for the current question. On completion, calls `/api/quiz/attempt/submit` and transitions to the result screen.

#### `QuestionCard` (`/src/components/quiz/QuestionCard.tsx`)

Renders a single question with its 4 answer options. Accepts an `onAnswer(index: number)` callback. Once an answer is selected, all options are disabled immediately (no changing answers). Styled with the dark zinc-950 background and red/amber accent for the selected option.

#### `QuestionTimer` (`/src/components/quiz/QuestionTimer.tsx`)

A 5-second countdown rendered as a shrinking red progress bar and a large numerical display. Accepts `onExpire()` callback. Uses `requestAnimationFrame` for smooth animation. Resets on each new question via a `key` prop change.

#### `FocusGuard` (`/src/components/quiz/FocusGuard.tsx`)

A renderless component (returns `null`) that registers and cleans up the three anti-cheat event listeners. Accepts `onVoid(reason)` callback and an `active` boolean prop. When `active` becomes `false`, all listeners are removed.

```typescript
interface FocusGuardProps {
  active: boolean;
  onVoid: (reason: 'visibility' | 'blur' | 'unload') => void;
}
```

The `blur` listener is attached to `window`. To avoid false positives from in-page focus shifts (e.g. clicking an answer option), the handler checks `document.hasFocus()` after a 50ms debounce before triggering a void.

#### `PointsWallet` (`/src/components/quiz/PointsWallet.tsx`)

Dashboard section component displaying the quiz points balance, naira equivalent, transaction history, and the "Redeem / Convert to Cash" button. Fetches data from `quiz_points_wallet` and `quiz_point_transactions` via a dedicated hook. Visually distinct from the Producer Hub wallet — uses amber accent instead of red, and a separate card layout.

#### `StreakBadge` (`/src/components/quiz/StreakBadge.tsx`)

Displays the current streak count and any earned milestone badges (7, 30, 100 days). Used on the quiz result screen, the user dashboard, and the public profile page. Accepts `streakCount` and `badges` as props.

#### `SlotPoller` (hook: `useSlotPoller`)

A custom hook (`/src/hooks/useSlotPoller.ts`) that polls `/api/quiz/slots` every 10 seconds while the user is on the pre-start screen. Returns `{ slotsRemaining, isStale }`. Sets `isStale = true` when a fetch fails, triggering the stale indicator UI.

```typescript
function useSlotPoller(enabled: boolean): {
  slotsRemaining: number;
  isStale: boolean;
}
```

## Data Models

### New Supabase Tables

#### `quiz_days`

Stores the generated questions and slot state for each calendar day (WAT).

```sql
CREATE TABLE quiz_days (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_date     DATE NOT NULL UNIQUE,          -- WAT calendar date e.g. 2025-07-15
  questions     JSONB NOT NULL,                -- array of 5 question objects
  slots_remaining INT NOT NULL DEFAULT 10,
  slots_claimed   INT NOT NULL DEFAULT 0,
  generation_status TEXT NOT NULL DEFAULT 'pending',  -- pending | ready | failed | fallback
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_days_date ON quiz_days(quiz_date);
```

The `questions` JSONB column stores an array of objects with this shape:

```json
[
  {
    "id": "uuid",
    "text": "Who wrote Death and the King's Horseman?",
    "options": ["Wole Soyinka", "Chinua Achebe", "Femi Osofisan", "Ola Rotimi"],
    "correctAnswerIndex": 0,
    "difficulty": "easy",
    "theme": "nigerian_playwrights",
    "index": 0
  }
]
```

#### `quiz_attempts`

One row per user per day. Enforced by a unique constraint.

```sql
CREATE TABLE quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_date       DATE NOT NULL,               -- WAT calendar date
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | completed | voided
  result_type     TEXT,                        -- won | consolation | failed | voided
  score           INT,                         -- 0-5
  points_awarded  INT NOT NULL DEFAULT 0,
  slot_position   INT,                         -- 1-10, only for 'won'
  question_ids    UUID[] NOT NULL DEFAULT '{}',
  answers         JSONB NOT NULL DEFAULT '[]', -- [{questionId, selectedIndex, elapsedMs}]
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  void_reason     TEXT,                        -- visibility | blur | unload | timeout
  UNIQUE(user_id, quiz_date)
);

CREATE INDEX idx_quiz_attempts_user_date ON quiz_attempts(user_id, quiz_date);
CREATE INDEX idx_quiz_attempts_date ON quiz_attempts(quiz_date);
```

#### `quiz_points_wallet`

One row per user. Created on first quiz completion.

```sql
CREATE TABLE quiz_points_wallet (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance     INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `quiz_point_transactions`

Append-only ledger for all points movements.

```sql
CREATE TABLE quiz_point_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_date       DATE,                        -- null for redemption entries
  result_type     TEXT NOT NULL,               -- won | consolation | failed | voided | redeemed
  points_delta    INT NOT NULL,                -- positive for awards, negative for redemptions
  balance_after   INT NOT NULL,
  attempt_id      UUID REFERENCES quiz_attempts(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_txn_user ON quiz_point_transactions(user_id, created_at DESC);
```

### Existing Table Modifications

#### `profiles` table

Two columns are added to the existing `profiles` table:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiz_streak INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiz_last_completion_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiz_badges TEXT[] NOT NULL DEFAULT '{}';
-- badges values: '7_day' | '30_day' | '100_day'
```

The `quiz_streak` column is the authoritative streak counter. `quiz_last_completion_date` is used by the streak calculation logic to determine whether to increment or reset.

### Supabase RPC Functions

#### `claim_winner_slot(p_quiz_date DATE, p_attempt_id UUID)`

Atomically decrements `slots_remaining` and returns the claimed slot position. Uses `FOR UPDATE` row locking to prevent concurrent over-claiming.

```sql
CREATE OR REPLACE FUNCTION claim_winner_slot(p_quiz_date DATE, p_attempt_id UUID)
RETURNS INT AS $$
DECLARE
  v_slot_position INT;
BEGIN
  -- Lock the quiz_days row for this date
  SELECT slots_claimed + 1 INTO v_slot_position
  FROM quiz_days
  WHERE quiz_date = p_quiz_date
    AND slots_remaining > 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;  -- No slots available
  END IF;

  UPDATE quiz_days
  SET slots_remaining = slots_remaining - 1,
      slots_claimed   = slots_claimed + 1,
      updated_at      = NOW()
  WHERE quiz_date = p_quiz_date;

  RETURN v_slot_position;
END;
$$ LANGUAGE plpgsql;
```

The API route calls this inside a Supabase transaction. If `claim_winner_slot` returns `NULL`, the attempt is recorded as `consolation` (20 points).

#### `convert_points_to_cash(p_user_id UUID, p_points INT)`

Atomically deducts from `quiz_points_wallet` and credits the producer hub balance. The producer hub balance is stored as a computed value from ticket sales and withdrawals, so this function inserts a synthetic credit entry into a `quiz_cash_credits` table that the producer wallet calculation includes.

```sql
CREATE OR REPLACE FUNCTION convert_points_to_cash(p_user_id UUID, p_points INT)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INT;
  v_new_balance INT;
BEGIN
  -- Lock and check balance
  SELECT balance INTO v_current_balance
  FROM quiz_points_wallet
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL OR v_current_balance < p_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  v_new_balance := v_current_balance - p_points;

  -- Deduct from points wallet
  UPDATE quiz_points_wallet
  SET balance = v_new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record the deduction transaction
  INSERT INTO quiz_point_transactions(user_id, result_type, points_delta, balance_after)
  VALUES (p_user_id, 'redeemed', -p_points, v_new_balance);

  -- Credit the producer hub (insert into quiz_cash_credits)
  INSERT INTO quiz_cash_credits(user_id, amount_naira, created_at)
  VALUES (p_user_id, p_points, NOW());

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;
```

A `quiz_cash_credits` table is added and the producer wallet balance calculation in `/src/app/producer/page.tsx` is updated to include `SUM(quiz_cash_credits.amount_naira)` for the authenticated user.

### TypeScript Types

New types added to `/src/lib/types.ts`:

```typescript
export type QuizResultType = 'won' | 'consolation' | 'failed' | 'voided' | 'redeemed';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizBadge = '7_day' | '30_day' | '100_day';

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  difficulty: QuizDifficulty;
  index: number;
  // correctAnswerIndex is NEVER sent to the client
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizDate: string;
  status: 'pending' | 'completed' | 'voided';
  resultType?: QuizResultType;
  score?: number;
  pointsAwarded: number;
  slotPosition?: number;
  answers: Array<{ questionId: string; selectedIndex: number; elapsedMs: number }>;
  startedAt: string;
  completedAt?: string;
}

export interface QuizPointTransaction {
  id: string;
  userId: string;
  quizDate?: string;
  resultType: QuizResultType;
  pointsDelta: number;
  balanceAfter: number;
  createdAt: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system -- essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Slot count never goes negative

*For any* initial slot count between 0 and 10 and any number of concurrent full-correct submissions, the resulting `slots_remaining` value in `quiz_days` should always be >= 0, and the total number of 100-point awards issued should equal `min(initial_slots, concurrent_submissions)`.

**Validates: Requirements 1.2, 4.7**

---

### Property 2: Answer recording fidelity

*For any* question index (0-4) and any answer selection (index 0-3 or -1 for timeout) submitted at any elapsed time (0-5000ms), the stored answer record in `quiz_attempts.answers` should contain exactly the submitted `selectedIndex` and `elapsedMs` values.

**Validates: Requirements 2.4, 9.1**

---

### Property 3: Question rendering always shows exactly 4 options

*For any* valid `QuizQuestion` object, rendering it with `QuestionCard` should produce exactly 4 selectable answer option elements in the DOM.

**Validates: Requirements 2.6**

---

### Property 4: Progress indicator accuracy

*For any* question index N between 1 and 5, the `QuizSession` progress indicator should display "Question N of 5".

**Validates: Requirements 2.8**

---

### Property 5: Voided attempt blocks same-day restart

*For any* user with a `voided` attempt record on calendar day D (WAT), a call to `POST /api/quiz/attempt/start` on day D should be rejected with an error response -- the user should not be able to start a new attempt on the same day.

**Validates: Requirements 3.8, 9.2**

---

### Property 6: FocusGuard cleanup on session end

*For any* session end type (completed, voided, or error), after the session ends, none of the three event listeners (`visibilitychange` on document, `blur` on window, `beforeunload` on window) should remain registered.

**Validates: Requirements 3.9**

---

### Property 7: Streak increments on every completion

*For any* completed quiz attempt (result type: won, consolation, or failed), the user's `quiz_streak` in `profiles` should be exactly 1 greater than it was before the attempt completed.

**Validates: Requirements 4.4, 5.3**

---

### Property 8: Voided attempts do not increment streak

*For any* voided quiz attempt, the user's `quiz_streak` in `profiles` should be unchanged from its value before the attempt was voided.

**Validates: Requirements 4.5**

---

### Property 9: Points transaction recorded for every award

*For any* points award (any amount, any result type), a corresponding row should exist in `quiz_point_transactions` with a matching `result_type`, `points_delta`, and `balance_after` equal to the wallet balance after the award.

**Validates: Requirements 4.6, 6.10**

---

### Property 10: Streak resets after a missed day

*For any* user with `quiz_streak > 0` and `quiz_last_completion_date` of day D, if the current WAT calendar day is D+2 or later (i.e. the user missed at least one day), then the streak calculation function should return 0.

**Validates: Requirements 5.4**

---

### Property 11: Milestone badges are awarded and retained permanently

*For any* user whose `quiz_streak` reaches 7, 30, or 100, the corresponding badge ('7_day', '30_day', '100_day') should be present in `profiles.quiz_badges` and should remain present even after the streak is subsequently reset to 0.

**Validates: Requirements 5.8, 5.9, 5.10**

---

### Property 12: Points balance naira display equals points value

*For any* integer points balance N >= 0, the `PointsWallet` component should display the naira equivalent as exactly N (i.e. "N points (N)").

**Validates: Requirements 6.2**

---

### Property 13: Transaction history is in reverse chronological order

*For any* set of `quiz_point_transactions` records for a user, the `PointsWallet` history display should render them in descending order of `created_at` (most recent first).

**Validates: Requirements 6.3**

---

### Property 14: Conversion atomicity -- over-balance rejection

*For any* conversion amount greater than the user's current `quiz_points_wallet.balance`, the `convert_points_to_cash` RPC should return an error and leave both the points wallet balance and the producer hub balance unchanged.

**Validates: Requirements 6.6, 6.9**

---

### Property 15: Question validation rejects malformed AI output

*For any* question object returned by the AI generator, the validation function should return `true` if and only if: `text.length <= 300`, `options.length === 4`, every option has `length <= 150`, `correctAnswerIndex` is an integer in [0, 3], and `difficulty` is one of 'easy', 'medium', 'hard'.

**Validates: Requirements 7.3**

---

### Property 16: Same-day question consistency

*For any* two calls to `GET /api/quiz/status` on the same WAT calendar day (by any two users), the `questions` array returned (without correct answers) should be identical in content and order.

**Validates: Requirements 7.4**

---

### Property 17: AI generator called at most once per day

*For any* number of question fetch requests on the same WAT calendar day, the Gemini API should be called exactly once -- subsequent requests should be served from the `quiz_days` cache.

**Validates: Requirements 7.6**

---

### Property 18: Complete attempt record contains all required fields

*For any* completed or voided quiz attempt, the stored `quiz_attempts` row should contain non-null values for: `user_id`, `quiz_date`, `question_ids` (length 5), `answers` (length 5), `status`, `result_type`, and `points_awarded`. The `slot_position` field should be non-null if and only if `result_type === 'won'`.

**Validates: Requirements 9.1**

---

### Property 19: Duplicate attempt rejection

*For any* user who already has a `quiz_attempts` row for the current WAT calendar day (in any status), a call to `POST /api/quiz/attempt/start` should be rejected.

**Validates: Requirements 9.2**

---

**Property Reflection:**

After reviewing the 19 properties above:

- Properties 5 and 19 both test duplicate attempt rejection. Property 19 is the more general form (covers all statuses: pending, completed, voided), so Property 5 is subsumed. However, Property 5 specifically tests the voided case which is the most important anti-cheat scenario, so both are retained for clarity.
- Properties 7 and 10 together cover the full streak lifecycle (increment on completion, reset on miss). They are complementary, not redundant.
- Property 9 and the transaction part of Property 18 overlap slightly. Property 9 tests the transaction ledger specifically; Property 18 tests the attempt record. They test different tables and are retained.
- Properties 14 (over-balance rejection) and 6.6 atomicity are related but test different failure modes. Both are retained.

No properties are eliminated. The set provides unique validation value across all testable acceptance criteria.

## Error Handling

### AI Question Generation Failures

The cron job at `/api/quiz/cron/generate` follows this retry and fallback sequence:

1. Call Gemini with the structured prompt. Parse the JSON response.
2. Validate all 5 questions against the schema (Property 15). If any question is invalid, retry up to 3 times with a fresh API call.
3. If all 3 retries fail, set `generation_status = 'fallback'` in `quiz_days` and load 5 questions from the pre-seeded fallback bank stored as a JSON file at `/src/data/quiz-fallback-questions.json`.
4. If the fallback bank itself is missing or malformed, set `generation_status = 'failed'` and leave `questions` empty. The `/api/quiz/status` endpoint will return `questionsReady: false`, and the Quiz_Page will display the error state with a retry button.

The retry button on the client calls `/api/quiz/status` again. If the admin has manually triggered a re-generation in the meantime, the page will recover automatically.

### Atomic Slot Claim Failures

If the `claim_winner_slot` RPC throws a database error (deadlock, timeout, connection loss):

- The API route catches the exception and records the attempt as `consolation` (20 points) rather than leaving it unresolved.
- The error is logged server-side with the `attempt_id` for manual audit.
- The user receives a response indicating they answered correctly but the slot could not be confirmed, and 20 points are awarded.

### Void Persistence Failures

If `POST /api/quiz/attempt/void` fails (network error, database error):

- The client retries up to 3 times with exponential backoff (500ms, 1000ms, 2000ms).
- If all retries fail, the client displays an error state and does NOT allow a new attempt to start.
- A server-side cleanup job (run as part of the midnight cron) marks any `pending` attempts older than 10 minutes as `voided` with `void_reason = 'timeout'`. This ensures the database is consistent even if the client-side void call never reached the server.

### Points Conversion Failures

The `convert_points_to_cash` RPC is a single PostgreSQL transaction. If any step fails:

- The entire transaction is rolled back automatically by PostgreSQL.
- The API route returns `{ success: false, error: '...' }`.
- The client displays the error message and leaves both wallet balances unchanged.
- No partial state is possible because both the deduction and the credit happen inside the same transaction.

### Email Delivery Failures

The `/api/quiz/cron/email` route iterates over all registered users and calls `/api/send-email` for each. If a single email fails:

- The failure is logged with the user's email address and the error message.
- The loop continues to the next user without aborting the batch.
- A summary of failed deliveries is logged at the end of the cron run.

### Stale Slot Count

If the `useSlotPoller` hook fails to fetch `/api/quiz/slots` (network error, 5xx response):

- `isStale` is set to `true`.
- The last known slot count is displayed with a visual indicator (e.g. a yellow dot and "Slot count may be outdated").
- The hook continues polling every 10 seconds and clears `isStale` on the next successful response.
- The Start button remains enabled -- the server will perform the authoritative check at submission time.

## Testing Strategy

### Overview

The testing strategy uses a dual approach: property-based tests for universal correctness properties and example-based unit/integration tests for specific scenarios, UI states, and infrastructure checks.

**Property-based testing library:** `fast-check` (TypeScript-native, works with Vitest and Jest, no additional runtime dependencies).

Install: `npm install --save-dev fast-check`

Each property test runs a minimum of 100 iterations. Tests are tagged with a comment referencing the design property they validate.

---

### Property-Based Tests

All property tests live in `/src/__tests__/quiz/properties/`.

#### `slot-claiming.property.test.ts`

```typescript
// Feature: daily-quiz, Property 1: Slot count never goes negative
import fc from 'fast-check';
import { claimWinnerSlotLogic } from '@/lib/quiz/slotClaiming';

test('slot count never goes negative under concurrent claims', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 10 }),  // initial slots
      fc.integer({ min: 1, max: 20 }),  // concurrent submissions
      (initialSlots, concurrentSubmissions) => {
        const result = claimWinnerSlotLogic(initialSlots, concurrentSubmissions);
        expect(result.slotsRemaining).toBeGreaterThanOrEqual(0);
        expect(result.awardsIssued).toBe(Math.min(initialSlots, concurrentSubmissions));
      }
    ),
    { numRuns: 100 }
  );
});
```

#### `answer-recording.property.test.ts`

```typescript
// Feature: daily-quiz, Property 2: Answer recording fidelity
import fc from 'fast-check';
import { buildAnswerRecord } from '@/lib/quiz/answerRecording';

test('answer record preserves submitted index and elapsed time', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 4 }),          // question index
      fc.integer({ min: -1, max: 3 }),          // selected answer (-1 = timeout)
      fc.integer({ min: 0, max: 5000 }),        // elapsed ms
      (questionIndex, selectedIndex, elapsedMs) => {
        const record = buildAnswerRecord(questionIndex, selectedIndex, elapsedMs);
        expect(record.selectedIndex).toBe(selectedIndex);
        expect(record.elapsedMs).toBe(elapsedMs);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### `question-rendering.property.test.ts`

```typescript
// Feature: daily-quiz, Property 3: Question rendering always shows exactly 4 options
import fc from 'fast-check';
import { render } from '@testing-library/react';
import { QuestionCard } from '@/components/quiz/QuestionCard';

const questionArb = fc.record({
  id: fc.uuid(),
  text: fc.string({ minLength: 1, maxLength: 300 }),
  options: fc.tuple(
    fc.string({ maxLength: 150 }),
    fc.string({ maxLength: 150 }),
    fc.string({ maxLength: 150 }),
    fc.string({ maxLength: 150 })
  ).map(t => Array.from(t)),
  difficulty: fc.constantFrom('easy', 'medium', 'hard'),
  index: fc.integer({ min: 0, max: 4 }),
});

test('QuestionCard always renders exactly 4 answer options', () => {
  fc.assert(
    fc.property(questionArb, (question) => {
      const { getAllByRole } = render(
        <QuestionCard question={question} onAnswer={() => {}} />
      );
      const options = getAllByRole('button');
      expect(options).toHaveLength(4);
    }),
    { numRuns: 100 }
  );
});
```

#### `streak-calculation.property.test.ts`

```typescript
// Feature: daily-quiz, Property 7: Streak increments on every completion
// Feature: daily-quiz, Property 10: Streak resets after a missed day
import fc from 'fast-check';
import { calculateNewStreak } from '@/lib/quiz/streakCalculation';

test('streak increments by 1 on consecutive day completion', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 999 }),  // current streak
      fc.date(),                          // last completion date
      (currentStreak, lastDate) => {
        const nextDay = new Date(lastDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const result = calculateNewStreak(currentStreak, lastDate, nextDay);
        expect(result).toBe(currentStreak + 1);
      }
    ),
    { numRuns: 100 }
  );
});

test('streak resets to 0 when a day is missed', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 999 }),  // current streak > 0
      fc.date(),                          // last completion date
      fc.integer({ min: 2, max: 365 }),   // days missed
      (currentStreak, lastDate, daysMissed) => {
        const currentDay = new Date(lastDate);
        currentDay.setDate(currentDay.getDate() + daysMissed);
        const result = calculateNewStreak(currentStreak, lastDate, currentDay);
        expect(result).toBe(0);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### `points-wallet.property.test.ts`

```typescript
// Feature: daily-quiz, Property 12: Points balance naira display equals points value
// Feature: daily-quiz, Property 13: Transaction history in reverse chronological order
import fc from 'fast-check';
import { formatPointsBalance, sortTransactions } from '@/lib/quiz/pointsWallet';

test('naira equivalent always equals points value', () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 1_000_000 }), (balance) => {
      const display = formatPointsBalance(balance);
      expect(display.nairaEquivalent).toBe(balance);
    }),
    { numRuns: 100 }
  );
});

test('transaction history is always in reverse chronological order', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.uuid(),
          createdAt: fc.date().map(d => d.toISOString()),
          pointsDelta: fc.integer(),
          resultType: fc.constantFrom('won', 'consolation', 'failed', 'redeemed'),
        }),
        { minLength: 0, maxLength: 50 }
      ),
      (transactions) => {
        const sorted = sortTransactions(transactions);
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i - 1].createdAt >= sorted[i].createdAt).toBe(true);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

#### `question-validation.property.test.ts`

```typescript
// Feature: daily-quiz, Property 15: Question validation rejects malformed AI output
import fc from 'fast-check';
import { validateQuestion } from '@/lib/quiz/questionValidation';

test('validation correctly identifies valid questions', () => {
  const validQuestionArb = fc.record({
    text: fc.string({ minLength: 1, maxLength: 300 }),
    options: fc.tuple(
      fc.string({ minLength: 1, maxLength: 150 }),
      fc.string({ minLength: 1, maxLength: 150 }),
      fc.string({ minLength: 1, maxLength: 150 }),
      fc.string({ minLength: 1, maxLength: 150 })
    ).map(t => Array.from(t)),
    correctAnswerIndex: fc.integer({ min: 0, max: 3 }),
    difficulty: fc.constantFrom('easy', 'medium', 'hard'),
  });

  fc.assert(
    fc.property(validQuestionArb, (q) => {
      expect(validateQuestion(q)).toBe(true);
    }),
    { numRuns: 100 }
  );
});

test('validation rejects questions with invalid fields', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        // text too long
        fc.record({ text: fc.string({ minLength: 301 }), options: fc.constant(['a','b','c','d']), correctAnswerIndex: fc.constant(0), difficulty: fc.constant('easy') }),
        // wrong number of options
        fc.record({ text: fc.constant('Q'), options: fc.array(fc.string(), { minLength: 1, maxLength: 3 }), correctAnswerIndex: fc.constant(0), difficulty: fc.constant('easy') }),
        // invalid answer index
        fc.record({ text: fc.constant('Q'), options: fc.constant(['a','b','c','d']), correctAnswerIndex: fc.oneof(fc.integer({ max: -1 }), fc.integer({ min: 4 })), difficulty: fc.constant('easy') }),
      ),
      (q) => {
        expect(validateQuestion(q)).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});
```

---

### Example-Based Unit Tests

All example tests live in `/src/__tests__/quiz/unit/`.

Key test files:

- `focusGuard.test.ts` -- verifies listener registration on session start, deregistration on session end (all three end types), and the 50ms debounce on blur.
- `quizPage.test.tsx` -- renders QuizPage in each of the 5 states and asserts the correct UI elements are present/absent.
- `attemptStart.test.ts` -- verifies that a duplicate start request (same user, same day) is rejected with a 409 response.
- `scoring.test.ts` -- verifies the three scoring outcomes: 100 points (all correct + slot available), 20 points (all correct + no slots), 0 points (any incorrect).
- `milestones.test.ts` -- verifies badge award at streak 7, 30, and 100, and that badges persist after streak reset.

---

### Integration Tests

All integration tests live in `/src/__tests__/quiz/integration/`. These use a test Supabase project or a local Supabase instance.

- `slotClaiming.integration.test.ts` -- runs 10 concurrent submit requests against a real `quiz_days` row with 5 slots and verifies exactly 5 wins are recorded.
- `pointsConversion.integration.test.ts` -- verifies the full conversion flow end-to-end: deduct from points wallet, credit producer hub, record transaction.
- `cronGenerate.integration.test.ts` -- calls the cron endpoint and verifies a `quiz_days` row is created with 5 valid questions.

---

### Smoke Tests

- `questionGeneration.smoke.test.ts` -- verifies the cron endpoint returns 200 and `quiz_days` has a row for today.
- `emailDispatch.smoke.test.ts` -- verifies the email cron endpoint returns 200 and logs at least one dispatch attempt.

## Implementation Details

### AI Question Generation Pipeline

The generation cron at `/api/quiz/cron/generate` uses the existing `GoogleGenerativeAI` client from `@google/generative-ai` (already in `package.json`). The prompt instructs Gemini to return a JSON array of exactly 5 questions covering the five required themes.

**Prompt structure:**

```
You are a quiz master for Curtain Call, the premier platform for Nigerian and African theatre.
Generate exactly 5 multiple-choice quiz questions as a JSON array.

Requirements:
- Cover ALL five themes (at least 1 question per theme):
  1. nigerian_playwrights: Nigerian playwrights and their works
  2. lagos_theatre_history: Theatre history in Lagos
  3. yoruba_performance: Yoruba performance and storytelling traditions
  4. stagecraft: Stagecraft and production terminology
  5. african_drama: Landmark African drama

- Each question must have:
  - "text": string, max 300 characters
  - "options": array of exactly 4 strings, each max 150 characters
  - "correctAnswerIndex": integer 0-3
  - "difficulty": "easy" | "medium" | "hard"
  - "theme": one of the five theme keys above

- Include at least 1 easy, 1 medium, and 1 hard question.

Return ONLY the JSON array. No markdown, no explanation.
```

The model is called with `responseMimeType: 'application/json'` (same pattern as the curator-ai route). The response is parsed, validated with `validateQuestion()` for each item, and stored in `quiz_days.questions`.

### Daily Email Scheduling

The email cron at `/api/quiz/cron/email`:

1. Fetches today's `quiz_days` row to get the teaser question (index 0) and current `slots_remaining`.
2. Fetches all user emails from the `profiles` table (or `auth.users` via the service role client).
3. For each user, calls the existing `POST /api/send-email` route with the quiz notification HTML template.
4. The email template includes:
   - Subject: "Today's quiz is live -- can you get all 5?"
   - Teaser: the text of question 0 (no options, no answer)
   - Slot counter: "X of 10 winner slots still open"
   - CTA button linking to `https://curtaincall.com.ng/quiz`

The email template follows the same dark-themed HTML style as the existing OTP email in `AuthContext.tsx`.

### Streak Calculation Logic

Streak logic is encapsulated in a pure function `calculateNewStreak` in `/src/lib/quiz/streakCalculation.ts`. All date comparisons use WAT (UTC+1).

```typescript
export function calculateNewStreak(
  currentStreak: number,
  lastCompletionDate: Date | null,
  todayWAT: Date
): number {
  if (!lastCompletionDate) return 1;  // first ever completion

  const lastDateStr = toWATDateString(lastCompletionDate);
  const todayStr = toWATDateString(todayWAT);
  const yesterdayStr = toWATDateString(addDays(todayWAT, -1));

  if (lastDateStr === yesterdayStr) {
    return currentStreak + 1;  // consecutive day
  } else if (lastDateStr === todayStr) {
    return currentStreak;  // same day (shouldn't happen due to duplicate check)
  } else {
    return 1;  // gap -- reset and start fresh
  }
}

function toWATDateString(date: Date): string {
  // WAT = UTC+1
  const wat = new Date(date.getTime() + 60 * 60 * 1000);
  return wat.toISOString().slice(0, 10);
}
```

The midnight cron also runs a streak reset pass: for any user whose `quiz_last_completion_date` is before yesterday (WAT), set `quiz_streak = 0`.

### Real-Time Slot Polling

The `useSlotPoller` hook uses `setInterval` with a 10-second interval. It is only active when the `enabled` prop is `true` (i.e. the user is on the pre-start screen and has not yet started a session).

```typescript
export function useSlotPoller(enabled: boolean) {
  const [slotsRemaining, setSlotsRemaining] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        const res = await fetch('/api/quiz/slots');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        setSlotsRemaining(data.slotsRemaining);
        setIsStale(false);
      } catch {
        setIsStale(true);
      }
    };

    poll();  // immediate first poll
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [enabled]);

  return { slotsRemaining, isStale };
}
```

When `slotsRemaining` drops to 0, the `QuizPage` transitions to the closed state without a full page reload.

### Focus Guard Implementation

```typescript
// /src/components/quiz/FocusGuard.tsx
'use client';
import { useEffect } from 'react';

interface FocusGuardProps {
  active: boolean;
  onVoid: (reason: 'visibility' | 'blur' | 'unload') => void;
}

export function FocusGuard({ active, onVoid }: FocusGuardProps) {
  useEffect(() => {
    if (!active) return;

    const handleVisibility = () => {
      if (document.hidden) onVoid('visibility');
    };

    let blurTimer: ReturnType<typeof setTimeout>;
    const handleBlur = () => {
      // Debounce 50ms to avoid false positives from in-page focus shifts
      blurTimer = setTimeout(() => {
        if (!document.hasFocus()) onVoid('blur');
      }, 50);
    };

    const handleUnload = () => onVoid('unload');

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleUnload);
      clearTimeout(blurTimer);
    };
  }, [active, onVoid]);

  return null;
}
```

The `onVoid` callback in `QuizSession` calls `POST /api/quiz/attempt/void` and then sets the session state to `voided`, which deactivates the FocusGuard (setting `active = false`) and triggers the cleanup via the `useEffect` return.

### Points Wallet to Producer Hub Conversion

The conversion flow in the UI:

1. User clicks "Redeem / Convert to Cash" in `PointsWallet`.
2. A modal appears with an input field pre-filled with the full balance. The user can enter any amount >= 1.
3. On confirm, the client calls `POST /api/quiz/points/convert` with `{ userId, pointsAmount }`.
4. The API route calls the `convert_points_to_cash` Supabase RPC.
5. On success, the client displays: "N has been moved to your wallet and is available for withdrawal."
6. The `PointsWallet` balance and the Producer Hub balance both update immediately (optimistic update, then re-fetch to confirm).

The producer hub balance calculation in `/src/app/producer/page.tsx` is updated to include quiz cash credits:

```typescript
// Add to the existing walletMetrics calculation
const { data: quizCredits } = await supabase
  .from('quiz_cash_credits')
  .select('amount_naira')
  .eq('user_id', user.id);

const totalQuizCredits = (quizCredits || []).reduce((acc, c) => acc + c.amount_naira, 0);
const available = Math.max(0, totalEarned + totalQuizCredits - totalWithdrawn - totalPending);
```

### Vercel Cron Configuration

`vercel.json` at the project root:

```json
{
  "crons": [
    {
      "path": "/api/quiz/cron/generate",
      "schedule": "0 23 * * *"
    },
    {
      "path": "/api/quiz/cron/email",
      "schedule": "7 0 * * *"
    }
  ]
}
```

Both cron routes verify the `Authorization: Bearer <CRON_SECRET>` header:

```typescript
const cronSecret = process.env.CRON_SECRET;
if (request.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

`CRON_SECRET` is added to the Vercel environment variables.

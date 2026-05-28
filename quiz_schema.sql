-- ========================================================
-- CURTAIN CALL — DAILY QUIZ SCHEMA
-- Tasks 1.1 and 1.2
-- ========================================================

-- ── TASK 1.1: TABLES ──────────────────────────────────

-- 1. quiz_days
--    Stores the generated questions and slot state for each WAT calendar day.
CREATE TABLE IF NOT EXISTS quiz_days (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_date         DATE        NOT NULL UNIQUE,
    questions         JSONB       NOT NULL DEFAULT '[]'::jsonb,
    slots_remaining   INT         NOT NULL DEFAULT 10,
    slots_claimed     INT         NOT NULL DEFAULT 0,
    generation_status TEXT        NOT NULL DEFAULT 'pending',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_days_date ON quiz_days(quiz_date);

ALTER TABLE quiz_days DISABLE ROW LEVEL SECURITY;


-- 2. quiz_attempts
--    One row per user per day. Enforced by a unique constraint.
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_date       DATE        NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'pending',
    result_type     TEXT,
    score           INT,
    points_awarded  INT         NOT NULL DEFAULT 0,
    slot_position   INT,
    question_ids    UUID[]      NOT NULL DEFAULT '{}',
    answers         JSONB       NOT NULL DEFAULT '[]'::jsonb,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    void_reason     TEXT,
    UNIQUE(user_id, quiz_date)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_date ON quiz_attempts(user_id, quiz_date);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_date      ON quiz_attempts(quiz_date);

ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;


-- 3. quiz_points_wallet
--    One row per user. Created on first quiz completion.
CREATE TABLE IF NOT EXISTS quiz_points_wallet (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance     INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quiz_points_wallet DISABLE ROW LEVEL SECURITY;


-- 4. quiz_point_transactions
--    Append-only ledger for all points movements.
CREATE TABLE IF NOT EXISTS quiz_point_transactions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_date     DATE,
    result_type   TEXT        NOT NULL,
    points_delta  INT         NOT NULL,
    balance_after INT         NOT NULL,
    attempt_id    UUID        REFERENCES quiz_attempts(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_txn_user ON quiz_point_transactions(user_id, created_at DESC);

ALTER TABLE quiz_point_transactions DISABLE ROW LEVEL SECURITY;


-- 5. quiz_cash_credits
--    Records naira credits converted from quiz points into the producer hub wallet.
CREATE TABLE IF NOT EXISTS quiz_cash_credits (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_naira INT         NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_cash_credits_user ON quiz_cash_credits(user_id);

ALTER TABLE quiz_cash_credits DISABLE ROW LEVEL SECURITY;


-- 6. profiles — add quiz columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiz_streak               INT     NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiz_last_completion_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiz_badges               TEXT[]  NOT NULL DEFAULT '{}';


-- ── TASK 1.2: RPC FUNCTIONS ───────────────────────────

-- claim_winner_slot(p_quiz_date DATE, p_attempt_id UUID)
--
-- Atomically decrements slots_remaining and returns the claimed slot position
-- (slots_claimed + 1 before the update).  Uses FOR UPDATE row locking to
-- prevent concurrent over-claiming.  Returns NULL when no slots are available.
CREATE OR REPLACE FUNCTION claim_winner_slot(p_quiz_date DATE, p_attempt_id UUID)
RETURNS INT AS $$
DECLARE
    v_slot_position INT;
BEGIN
    -- Lock the quiz_days row for this date and read the next slot position.
    SELECT slots_claimed + 1 INTO v_slot_position
    FROM   quiz_days
    WHERE  quiz_date        = p_quiz_date
      AND  slots_remaining  > 0
    FOR UPDATE;

    -- No row found or no slots remaining — caller should award consolation points.
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Decrement available slots and increment claimed count atomically.
    UPDATE quiz_days
    SET    slots_remaining = slots_remaining - 1,
           slots_claimed   = slots_claimed   + 1,
           updated_at      = NOW()
    WHERE  quiz_date = p_quiz_date;

    RETURN v_slot_position;
END;
$$ LANGUAGE plpgsql;


-- convert_points_to_cash(p_user_id UUID, p_points INT)
--
-- Atomically deducts p_points from quiz_points_wallet, records the deduction
-- in quiz_point_transactions, and inserts a quiz_cash_credits row so the
-- producer hub balance calculation can include the converted amount.
-- Returns a JSONB object: { success, new_balance } on success or
-- { success: false, error } when the balance is insufficient.
CREATE OR REPLACE FUNCTION convert_points_to_cash(p_user_id UUID, p_points INT)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INT;
    v_new_balance     INT;
BEGIN
    -- Lock the wallet row and read the current balance.
    SELECT balance INTO v_current_balance
    FROM   quiz_points_wallet
    WHERE  user_id = p_user_id
    FOR UPDATE;

    -- Reject if the wallet does not exist or the balance is insufficient.
    IF v_current_balance IS NULL OR v_current_balance < p_points THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    v_new_balance := v_current_balance - p_points;

    -- Deduct from the points wallet.
    UPDATE quiz_points_wallet
    SET    balance    = v_new_balance,
           updated_at = NOW()
    WHERE  user_id = p_user_id;

    -- Record the deduction in the transaction ledger.
    INSERT INTO quiz_point_transactions(user_id, result_type, points_delta, balance_after)
    VALUES (p_user_id, 'redeemed', -p_points, v_new_balance);

    -- Credit the producer hub via the cash credits table.
    INSERT INTO quiz_cash_credits(user_id, amount_naira, created_at)
    VALUES (p_user_id, p_points, NOW());

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;

# Requirements Document

## Introduction

The Daily Quiz is Curtain Call's primary daily retention mechanic — a timed, theatre-themed quiz that opens every day and rewards the first 10 users who answer all questions correctly. It is designed to drive daily engagement, build user streaks, and distribute points that can be converted to withdrawable cash. The feature includes AI-generated questions, anti-cheat focus detection, a points wallet on the user dashboard, and daily email notifications.

## Glossary

- **Quiz_System**: The server-side component responsible for managing daily quiz state, question generation, slot tracking, and attempt validation.
- **Quiz_Page**: The client-side page at `/quiz` accessible from the main navigation and user dashboard.
- **Quiz_Session**: A single user's active attempt at the daily quiz, from clicking Start to submission or voiding.
- **Question_Timer**: The per-question countdown component that displays remaining time and auto-submits a wrong answer on expiry.
- **Focus_Guard**: The client-side event listener system that monitors tab visibility, window blur, and navigation events during an active Quiz_Session.
- **Points_Wallet**: The user-facing wallet on the dashboard that holds quiz-earned points, separate from the Producer Hub wallet.
- **Producer_Hub_Wallet**: The existing producer-side wallet used for ticket sales revenue and Paystack withdrawals.
- **Streak_Counter**: The per-user count of consecutive days on which the user completed the daily quiz.
- **Winner_Slot**: One of the 10 available positions for full-reward (100-point) winners each day.
- **WAT**: West Africa Time, UTC+1, the timezone used for all daily reset and scheduling logic.
- **AI_Generator**: The Google Generative AI integration that produces the daily set of 5 quiz questions.
- **Email_Service**: The Resend-based transactional email system used to send daily quiz notifications.

---

## Requirements

### Requirement 1: Daily Quiz Lifecycle and State Management

**User Story:** As a registered user, I want to see the current state of the daily quiz when I visit the quiz page, so that I know whether I can participate, how many winner slots remain, and when the quiz resets.

#### Acceptance Criteria

1. THE Quiz_System SHALL generate exactly 5 multiple-choice questions once per day at midnight WAT and store them for all users on that calendar day.
2. THE Quiz_System SHALL initialise 10 Winner_Slots at midnight WAT each day and decrement the count by 1 each time a user earns a full-reward win (all 5 questions correct in a non-voided attempt). The Winner_Slot count SHALL never fall below 0.
3. WHEN a user visits the Quiz_Page and the quiz is live with at least 1 Winner_Slot remaining, THE Quiz_Page SHALL display the quiz title, a "Quiz is Live" status indicator, the number of remaining Winner_Slots (e.g. "7 of 10 slots remaining"), the anti-cheat notice, and a Start button.
4. WHEN the Winner_Slots count reaches 0 before midnight WAT, THE Quiz_Page SHALL display a closed state with a countdown timer to the next day's quiz opening and a link to view today's correct answers.
5. WHEN a user visits the Quiz_Page and the user has already completed today's quiz, THE Quiz_Page SHALL display the user's score (X of 5 correct), points earned, and current Streak_Counter value — with no Start button.
6. WHEN a user visits the Quiz_Page and the user's attempt was v3. WHEN a user visits the Quiz_Page andching tabs/windows during an active attempt), THE Quiz_Page SHALL display the voided-attempt message and a countdown to tomorrow's quiz — with no Start button.
7. WHILE quiz questions are being fetched from the server, THE Quiz_Page SHALL display a loading state.
8. THE Quiz_System SHALL reset Winner_Slots to 10 and generate new questions at midnight WAT regardless of whether the previous day's slots were fully claimed.
9. IF the Quiz_System fails to fetch questions for the current day (e.g. network error or generation failure), THEN THE Quiz_Page SHALL display an error state with a retry option rather than a Start button.

---

### Requirement 2: Quiz Session Flow and Question Presentation

**User Story:** As a registered user, I want to answer timed questions one at a time without being able to go back, so that the quiz is fair and prevents Googling.

#### Acceptance Criteria

1. WHEN a user clicks the Start button, THE Quiz_Session SHALL begin and THE Focus_Guard SHALL activate immediately before the first question is displayed.
2. THE Quiz_Page SHALL present questions one at a time in a fixed sequence with no UI control to navigate to a previous question.
3. WHEN a question is displayed, THE Question_Timer SHALL start a 5-second countdown visible on screen as a prominent shrinking progress bar or large numerical display.
4. WHEN the user selects an answer before the Question_Timer reaches zero, THE Quiz_System SHALL record the selected answer index and the elapsed time in milliseconds, then advance to the next question without allowing the selection to be changed.
5. WHEN the Question_Timer reaches zero before the user selects an answer, THE Quiz_System SHALL record that question as incorrect with a time value of 5000 milliseconds, and advance to the next question.
6. THE Quiz_Page SHALL display exactly 4 answer options per question as individually selectable choices.
7. WHEN the user answers the final (5th) question, THE Quiz_System SHALL immediately evaluate the session and display the result screen.
8. THE Quiz_Page SHALL display a question progress indicator (e.g. "Question 3 of 5") so the user knows their position in the sequence.

---

### Requirement 3: Focus Guard and Anti-Cheat Enforcement

**User Story:** As the platform, I want to void any quiz attempt where the user navigates away, switches tabs, or loses window focus, so that the integrity of the quiz is maintained.

#### Acceptance Criteria

1. WHILE a Quiz_Session is active, THE Focus_Guard SHALL listen for the `visibilitychange` browser event on the document.
2. WHILE a Quiz_Session is active, THE Focus_Guard SHALL listen for the `blur` event on the window object. The `blur` event SHALL only trigger a void when the entire browser window loses focus — focus shifts between elements within the same page SHALL NOT trigger a void.
3. WHILE a Quiz_Session is active, THE Focus_Guard SHALL listen for the `beforeunload` event on the window object.
4. WHEN the `visibilitychange` event fires and the document becomes hidden during an active Quiz_Session, THE Quiz_System SHALL mark the attempt as voided within 500 milliseconds, stop the Question_Timer, and discard any in-progress answer selection.
5. WHEN the `blur` event fires on the window during an active Quiz_Session, THE Quiz_System SHALL mark the attempt as voided within 500 milliseconds, stop the Question_Timer, and discard any in-progress answer selection.
6. WHEN the `beforeunload` event fires during an active Quiz_Session, THE Quiz_System SHALL mark the attempt as voided and record the voided attempt against the user for that server-side calendar day (WAT).
7. WHEN an attempt is voided, THE Quiz_Page SHALL display the message: "Attempt voided. You navigated away during the quiz. Come back tomorrow."
8. WHEN an attempt is voided, THE Quiz_System SHALL prevent the user from starting a new attempt on the same server-side calendar day (WAT). IF the void record fails to persist, THE Quiz_System SHALL retry the write and display an error state rather than allowing a new attempt.
9. WHEN the Quiz_Session ends — whether by completion, voiding, or error — THE Focus_Guard SHALL deactivate and remove all event listeners.

---

### Requirement 4: Scoring and Reward Distribution

**User Story:** As a registered user, I want to receive points immediately after completing the quiz based on my score and slot availability, so that I am rewarded fairly for my performance.

#### Acceptance Criteria

1. WHEN a user completes the quiz AND all 5 answers are correct AND at least 1 Winner_Slot is available at the moment of submission, THE Quiz_System SHALL award 100 points to the user's Points_Wallet and record the user's slot position (e.g. 7th of 10).
2. WHEN a user completes the quiz AND all 5 answers are correct AND all 10 Winner_Slots are already claimed at the moment of submission, THE Quiz_System SHALL award 20 points to the user's Points_Wallet and display a message indicating the user answered correctly but slots were filled before submission.
3. WHEN a user completes the quiz with at least 1 incorrect answer, THE Quiz_System SHALL award 0 points and record the attempt as a participation entry.
4. THE Quiz_System SHALL add a Streak_Counter day to the user's profile for every quiz completion regardless of score, including consolation and zero-point completions.
5. IF a quiz attempt is voided (the user navigated away or switched tabs/windows during the session), THEN THE Quiz_System SHALL NOT award a Streak_Counter day for that attempt.
6. WHEN points are awarded, THE Quiz_System SHALL credit the Points_Wallet within 3 seconds and record the transaction in the points history log with the date, quiz result type, and points amount.
7. WHEN a user submits the final answer, THE Quiz_System SHALL check Winner_Slot availability atomically (using a database transaction or equivalent) to prevent race conditions from awarding more than 10 full-reward wins per day. The slot count resets at midnight WAT.
8. IF the atomic slot check fails due to a system error, THEN THE Quiz_System SHALL record the attempt as a consolation result (20 points) rather than leaving the attempt in an unresolved state.

---

### Requirement 5: Streak System and Milestone Badges

**User Story:** As a registered user, I want to see my quiz streak and earn milestone badges, so that I am motivated to return daily.

#### Acceptance Criteria

1. THE Quiz_System SHALL maintain a Streak_Counter per user representing the number of consecutive server-side calendar days (WAT) on which the user completed the daily quiz.
2. WHEN a user completes the quiz for the first time, THE Quiz_System SHALL set the Streak_Counter to 1.
3. WHEN a user completes the quiz on a calendar day (WAT) immediately following their previous completion day with no gap, THE Quiz_System SHALL increment the Streak_Counter by 1.
4. IF a user does not complete the quiz on a given calendar day (WAT), THEN at midnight WAT of the following day THE Quiz_System SHALL reset the Streak_Counter to 0.
5. WHEN a Quiz_Session ends with a completion (any score), THE Quiz_Page SHALL display the updated Streak_Counter value.
6. THE user dashboard SHALL display the current Streak_Counter value in a visible location.
7. THE user profile page SHALL display the Streak_Counter as a public badge visible to other users.
8. WHEN a user's Streak_Counter reaches 7, THE Quiz_System SHALL award a 7-day milestone badge to the user's profile. This badge SHALL be retained permanently regardless of subsequent streak resets.
9. WHEN a user's Streak_Counter reaches 30, THE Quiz_System SHALL award a 30-day milestone badge to the user's profile. This badge SHALL be retained permanently regardless of subsequent streak resets.
10. WHEN a user's Streak_Counter reaches 100, THE Quiz_System SHALL award a 100-day milestone badge to the user's profile. This badge SHALL be retained permanently regardless of subsequent streak resets.
11. THE user profile page SHALL display all earned milestone badges alongside the current Streak_Counter.

---

### Requirement 6: Points Wallet

**User Story:** As a registered user, I want to view my quiz points balance and history on my dashboard, so that I can track my earnings and convert them to withdrawable cash.

#### Acceptance Criteria

1. THE user dashboard SHALL display a Points_Wallet section that is visually distinct from the Producer_Hub_Wallet with a separate label, separate layout section, and no shared UI elements.
2. THE Points_Wallet section SHALL display the current points balance with its naira equivalent in brackets at a fixed rate of 1 point = ₦1 — e.g. "340 points (₦340)".
3. THE Points_Wallet section SHALL display a history log showing the date, quiz result type (won / consolation / failed / voided / redeemed), and points awarded or deducted for every entry in reverse chronological order.
4. THE Points_Wallet section SHALL display a "Redeem / Convert to Cash" button.
5. WHEN the user clicks "Redeem / Convert to Cash", THE Quiz_Page SHALL present a conversion flow where the user enters or selects an amount to convert. The minimum convertible amount SHALL be 1 point (₦1).
6. WHEN the user confirms a conversion, THE Quiz_System SHALL atomically deduct the selected amount from the Points_Wallet balance and add the equivalent naira amount to the Producer_Hub_Wallet. IF either operation fails, THEN both operations SHALL be rolled back and the user SHALL be shown an error message.
7. WHEN a conversion is confirmed successfully, THE Quiz_Page SHALL display the confirmation message: "₦[amount] has been moved to your wallet and is available for withdrawal."
8. THE Quiz_System SHALL NOT transfer funds directly from the Points_Wallet to any external account — all withdrawals SHALL occur through the Producer_Hub_Wallet via the existing Paystack withdrawal flow.
9. IF the user attempts to convert an amount greater than their current Points_Wallet balance, THEN THE Quiz_System SHALL reject the conversion and display an error message stating the available balance.
10. WHEN a conversion is completed, THE Points_Wallet history log SHALL record a "redeemed" entry with the date and amount deducted.

---

### Requirement 7: AI Question Generation

**User Story:** As the platform, I want quiz questions to be generated fresh each day by an AI system, so that users always encounter new content themed around Nigerian and African theatre.

#### Acceptance Criteria

1. THE AI_Generator SHALL produce exactly 5 multiple-choice questions per day using the Google Generative AI integration already present in the codebase.
2. WHEN generating questions, THE AI_Generator SHALL use a prompt that covers all five of the following themes, with at least 1 question per theme: Nigerian playwrights and their works; theatre history in Lagos; Yoruba performance and storytelling traditions; stagecraft and production terminology; and landmark African drama.
3. THE AI_Generator SHALL return each question as structured data with the fields: question text (maximum 300 characters), options (array of exactly 4 strings, each maximum 150 characters), correct answer index (integer 0–3), and difficulty (one of: easy / medium / hard). The 5 questions SHALL include at least 1 of each difficulty level.
4. THE Quiz_System SHALL store the generated questions for the current calendar day (WAT) so that all users on the same calendar day receive the same questions. Stored questions SHALL be discarded at the next midnight WAT reset.
5. IF the AI_Generator returns a response where any question is missing a required field, has a correct answer index outside 0–3, or has a number of options other than 4, THEN THE Quiz_System SHALL retry the generation up to 3 times. IF all retries fail, THEN THE Quiz_System SHALL fall back to a pre-seeded question bank containing at least 5 valid questions.
6. WHEN questions have been generated and cached for the current day, THE AI_Generator SHALL NOT be called again until the next midnight WAT reset — questions SHALL NOT be generated per-user or per-session.

---

### Requirement 8: Daily Email Notification

**User Story:** As a registered user, I want to receive a daily email at 8:00am WAT with a teaser question and slot availability, so that I am reminded to participate in the quiz.

#### Acceptance Criteria

1. THE Email_Service SHALL send a daily notification email to all registered users at 8:00am WAT each day.
2. THE email subject line SHALL be: "Today's quiz is live — can you get all 5?"
3. THE email body SHALL include one teaser question from today's quiz — question text only, with no answer options displayed.
4. THE email body SHALL include a visible slot counter showing the number of Winner_Slots remaining at the time the email batch is dispatched — e.g. "9 of 10 winner slots still open."
5. THE email body SHALL include a single call-to-action button linking directly to the Quiz_Page URL.
6. IF a user has already completed today's quiz at the time the email is sent, THE Email_Service SHALL still send the email — the Quiz_Page will display the completed state on arrival.
7. THE Email_Service SHALL use the Resend integration already present in the codebase to deliver the emails.
8. IF the Email_Service fails to deliver to a specific user, THE Quiz_System SHALL log the failure and continue sending to remaining users without aborting the batch.

---

### Requirement 9: Data Persistence Per Attempt

**User Story:** As the platform, I want to store complete data for every quiz attempt, so that results are auditable and the system can accurately enforce daily limits and slot positions.

#### Acceptance Criteria

1. THE Quiz_System SHALL store the following fields for every quiz attempt: user identifier, calendar date of attempt (WAT), question IDs served, answers selected by the user (one index per question), time taken per question in milliseconds, result type (won / consolation / failed / voided), points awarded, and slot position (present only when result is won; absent otherwise).
2. IF a user attempts to start a quiz and an attempt record already exists for that user on the current calendar day (WAT), THEN THE Quiz_System SHALL reject the start request and display an indication that the user has already attempted today's quiz.
3. WHEN a user clicks Start, THE Quiz_System SHALL create a pending attempt record in persistent storage before presenting the first question. IF the attempt record creation fails, THEN THE Quiz_System SHALL reject the quiz start and display an error to the user rather than proceeding without a record.
4. WHEN the Focus_Guard triggers a void during an active Quiz_Session, THE Quiz_System SHALL update the attempt record result type to "voided" within 500 milliseconds.
5. WHEN a quiz session completes (all 5 questions answered), THE Quiz_System SHALL update the attempt record with the final result type and points awarded within 3 seconds of the last answer being submitted.

---

### Requirement 10: Real-Time Winner Slot Display

**User Story:** As a user on the quiz page, I want to see the remaining winner slots update in real time, so that I have accurate information about competition before and during the quiz.

#### Acceptance Criteria

1. WHEN the Quiz_Page loads, THE Quiz_Page SHALL display the current number of remaining Winner_Slots as a server-authoritative value between 0 and 10 inclusive.
2. WHILE a user is viewing the Quiz_Page pre-start screen, THE Quiz_Page SHALL refresh the Winner_Slot count from the server at an interval of no more than 10 seconds.
3. WHEN a Winner_Slot is claimed by another user, THE Quiz_Page SHALL reflect the updated count within 10 seconds for users currently viewing the pre-start screen.
4. WHEN all 10 Winner_Slots are claimed while a user is on the pre-start screen, THE Quiz_Page SHALL transition to the closed state (slot count displays 0, Start button is disabled or hidden, closed-state UI is shown) without requiring a full page reload.
5. IF the connection to the server is interrupted while the user is on the pre-start screen, THEN THE Quiz_Page SHALL display a visual indicator that the slot count may be stale until the connection is restored.

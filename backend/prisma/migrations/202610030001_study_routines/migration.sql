ALTER TABLE "flashcards" ADD COLUMN "due_at" TIMESTAMPTZ,
  ADD COLUMN "interval_days" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  ADD COLUMN "repetitions" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcard_schedule_bounds" CHECK (interval_days BETWEEN 0 AND 3650 AND ease BETWEEN 1.3 AND 3.0 AND repetitions >= 0);
CREATE TABLE "flashcard_reviews" (
 "id" UUID PRIMARY KEY, "card_id" UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
 "request_id" UUID NOT NULL, "rating" TEXT NOT NULL CHECK (rating IN ('AGAIN','HARD','GOOD','EASY')),
 "scheduled_at" TIMESTAMPTZ NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(card_id, request_id)
);
CREATE TABLE "study_plans" (
 "id" UUID PRIMARY KEY, "user_id" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 "title" TEXT NOT NULL, "exam_date" DATE NOT NULL,
 "daily_minutes" INTEGER NOT NULL CHECK (daily_minutes BETWEEN 10 AND 180),
 "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "study_plans_user_id_exam_date_idx" ON study_plans(user_id,exam_date);
CREATE TABLE "study_tasks" (
 "id" UUID PRIMARY KEY, "plan_id" UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
 "title" TEXT NOT NULL, "date" DATE NOT NULL, "minutes" INTEGER NOT NULL CHECK (minutes BETWEEN 1 AND 180),
 "kind" TEXT NOT NULL CHECK (kind IN ('DOCUMENT','QUIZ','FLASHCARDS','NOTES')),
 "resource_id" UUID, "completed_at" TIMESTAMPTZ
);
CREATE INDEX "study_tasks_plan_id_date_idx" ON study_tasks(plan_id,date);
CREATE TABLE "exam_sessions" (
 "id" UUID PRIMARY KEY, "user_id" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 "quiz_id" UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
 "request_id" UUID NOT NULL, "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "deadline" TIMESTAMPTZ NOT NULL, "answers" JSONB NOT NULL DEFAULT '[]', "finished_at" TIMESTAMPTZ,
 "results" JSONB, "score" INTEGER, "total" INTEGER NOT NULL,
 UNIQUE(user_id,request_id), CHECK (total BETWEEN 1 AND 20), CHECK (score IS NULL OR score BETWEEN 0 AND total)
);
CREATE INDEX "exam_sessions_user_id_started_at_idx" ON exam_sessions(user_id,started_at);

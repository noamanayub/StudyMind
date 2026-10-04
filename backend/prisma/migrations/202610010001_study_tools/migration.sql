-- AlterTable
-- Additive Phase 2 migration. Existing learner records are preserved.
ALTER TABLE "users" ADD COLUMN     "answer_style" TEXT NOT NULL DEFAULT 'BALANCED',
ADD COLUMN     "density" TEXT NOT NULL DEFAULT 'COMFORTABLE',
ADD COLUMN     "explanation_level" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
ADD COLUMN     "reading_size" TEXT NOT NULL DEFAULT 'DEFAULT',
ADD COLUMN     "reduce_motion" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "summaries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workspace_id" UUID,
    "document_ids" UUID[],
    "request_id" UUID,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'SUMMARY',
    "format" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "coverage" JSONB NOT NULL DEFAULT '{}',
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workspace_id" UUID,
    "document_ids" UUID[],
    "request_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "question_count" INTEGER NOT NULL,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "coverage" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correct_answer" TEXT NOT NULL,
    "accepted_answers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "explanation" TEXT NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "results" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_decks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workspace_id" UUID,
    "document_ids" UUID[],
    "request_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "coverage" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "flashcard_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" UUID NOT NULL,
    "deck_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_activities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "resource_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "summaries_user_id_kind_updated_at_idx" ON "summaries"("user_id", "kind", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "summaries_user_id_request_id_key" ON "summaries"("user_id", "request_id");

-- CreateIndex
CREATE INDEX "quizzes_user_id_created_at_idx" ON "quizzes"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_user_id_request_id_key" ON "quizzes"("user_id", "request_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_quiz_id_position_key" ON "quiz_questions"("quiz_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_quiz_id_request_id_key" ON "quiz_attempts"("quiz_id", "request_id");

-- CreateIndex
CREATE INDEX "flashcard_decks_user_id_updated_at_idx" ON "flashcard_decks"("user_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_decks_user_id_request_id_key" ON "flashcard_decks"("user_id", "request_id");

-- CreateIndex
CREATE UNIQUE INDEX "flashcards_deck_id_position_key" ON "flashcards"("deck_id", "position");

-- CreateIndex
CREATE INDEX "study_activities_user_id_created_at_idx" ON "study_activities"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_activities" ADD CONSTRAINT "study_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE users ADD CONSTRAINT users_preferences_check CHECK (
  answer_style IN ('SHORT','BALANCED','DETAILED') AND explanation_level IN ('BEGINNER','INTERMEDIATE','ADVANCED')
  AND reading_size IN ('DEFAULT','LARGE') AND density IN ('COMFORTABLE','COMPACT'));
ALTER TABLE summaries ADD CONSTRAINT summaries_kind_check CHECK (kind IN ('SUMMARY','NOTES'));
ALTER TABLE quizzes ADD CONSTRAINT quizzes_settings_check CHECK (difficulty IN ('EASY','MEDIUM','HARD') AND question_count IN (5,10,15,20));
ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_type_check CHECK (type IN ('MULTIPLE_CHOICE','TRUE_FALSE','SHORT_ANSWER'));
ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_score_check CHECK (score >= 0 AND score <= total AND total > 0);
ALTER TABLE flashcards ADD CONSTRAINT flashcards_status_check CHECK (status IN ('NEW','LEARNING','KNOWN','REVIEW'));

